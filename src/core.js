const { cache } = require('./cache')
const ical = require('node-ical')
const icsBuilder = require('ics')

const adeUrl = (ecole, resources) => {
  return `${process.env.ADE_BASE_URL}${ecole}?resources=${resources}`
}

const authHeader = () => {
  const username = process.env.ADE_USERNAME
  const password = process.env.ADE_PASSWORD
  return {
    Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
  }
}

const fetchEvents = async (ecole, resources) => {
  return Object.values(await ical.async.fromURL(
    adeUrl(ecole, resources),
    { headers: { ...authHeader() } }
  ))
}

const fetchEventsCached = async (ecole, resources) => {
  const key = ecole + resources

  if (process.env.CACHE_ENABLE === 'false') {
    console.log(key + ' fetch')
    return fetchEvents(ecole, resources)
  }

  if (cache.has(key)) {
    console.log(key + ' retrieved')
    return cache.get(key)
  } else {
    const data = fetchEvents(ecole, resources)
    console.log(key + ' set')
    cache.set(key, data)
    return data
  }
}

const findCourseId = (description) => {
  const match = description.match(/(\w+)_(\d{4})_(S\d)_(\w+)_(\w+)/gm)
  if (match !== null) {
    return match[0]
  }

  const hardValues = ['2a', 'Evenements 2A', 'seoc2a_g1']
  const description_lines = description.split(/[\r\n]/)
    .map(l => l.trim())
    .filter(l => l !== '')

  for (const line of description_lines) {
    if (hardValues.includes(line)) {
      return line
    }
  }

  return null
}

const parseCourseId = (courseId) => {
  if (!courseId) return null
  const regex = /(?<name>\w+)_(?<year>\d{4})_(?<semester>S\d)_(?<type>\w+)_(?<group>\w+)/g
  return [...courseId.matchAll(regex)][0]?.groups ?? null
}

const parseResources = (resourceQuery) => {
  if (!resourceQuery) return []
  resourceQuery = Array.isArray(resourceQuery) ? resourceQuery : [resourceQuery]
  const regex = /(?<ecole>\D+)(?<ids>[\d,]+)/g
  const resources = resourceQuery.map(r => [...r.matchAll(regex)][0]?.groups)
    .map(r => {
      if (!r?.ids || !r?.ecole) {
        return null
      }
      r.ids = r.ids.split(','); return r
    })
    .filter(r => r !== null)
  return resources
}

const parseFilters = (filterQuery) => {
  if (!filterQuery) return []
  filterQuery = Array.isArray(filterQuery) ? filterQuery : [filterQuery]
  return filterQuery.map(f => f.split(','))
}

const groupFilter = (courseName, group) => {
  return (evt) => {
    if (!evt.course) return 1
    if (evt.course.name === courseName) {
      return evt.course.group === group
    }
    return 1
  }
}

const hideFilter = (courseName) => {
  return (evt) => {
    if (!evt.course) return 1
    return evt.course.name !== courseName
  }
}

const applyFilters = (data, filters) => {
  let events = data
  filters.forEach(f => {
    if (f.length < 2) return

    const filter_type = f[0]
    const courseName = f[1]

    switch (filter_type) {
      case 'h': // hide
        events = events.filter(hideFilter(courseName))
        break

      case 'g': // groups
        events = events.filter(groupFilter(courseName, f[2]))
        break
      default:
        break
    }
  })
  return events
}

const dateToIcsArray = (datestring) => {
  const d = new Date(datestring)
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()]
}

const parseEvents = async (req, res, next) => {
  const resources = parseResources(req.query.resource)
  let edt = []
  for (const resource of Object.values(resources)) {
    if (!resource?.ids || !resource?.ecole) {
      continue
    }
    for (const id of resource.ids) {
      const data = await fetchEventsCached(resource.ecole, id)
      edt = edt.concat(data.map(e => Object.assign(e, { origin: `${resource.ecole}${resource.ids}` })))
    }
  }

  const events = edt.map(event => {
    event.course = parseCourseId(findCourseId(event.description))

    return {
      name: event.summary,
      description: event.description.trim(),
      location: event.location,
      start: event.start,
      end: event.end,
      course: event.course,
      origin: event.origin,
      id: event.uid
    }
  })

  const filters = parseFilters(req.query.filter)
  const filtered_events = applyFilters(events, filters)

  req.events = filtered_events

  req.debug = {
    query: { resources, filters },
    length: filtered_events.length,
    data: filtered_events
  }

  next()
}

const parseCourses = (req, res, next) => {
  const courses = []
  req.events.forEach((v, i, s) => {
    if (!v.course?.name) {
      return
    }
    if (courses.some(c => c.name === v.course.name)) {
      const i = courses.findIndex(c => c.name === v.course.name)
      if (groupToInt(courses[i].maxgroup) < groupToInt(v.course.group)) {
        courses[i].maxgroup = v.course.group
      }
    } else {
      courses.push({
        name: v.course.name,
        maxgroup: v.course.group
      })
    }
  })
  req.courses = courses
  next()
}

const groupToInt = (group) => {
  return parseInt(group.substring(1), 10)
}

const json = (req, res) => {
  res.append('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.json({
    data: {
      courses: req.courses,
      events: req.events
    },
    length: req.events.length
  })
}

const debug = (req, res) => {
  res.json(req.debug)
}

const ics = (req, res) => {
  const formatted_events = req.events.map(evt => {
    return {
      title: evt.summary,
      description: evt.description,
      location: evt.location,
      start: dateToIcsArray(evt.start),
      end: dateToIcsArray(evt.end),
      method: 'REQUEST'
    }
  })
  const { error, value } = icsBuilder.createEvents(formatted_events)
  if (error) console.log(error)

  res.append('content-type', 'text/calendar')
  res.append('content-disposition', 'filename="agenda.ics"')
  res.send(value)
}

module.exports = {
  parseEvents,
  parseCourses,
  ics,
  debug,
  json
}
