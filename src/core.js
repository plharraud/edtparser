const { cache } = require('./cache')
const ical = require('node-ical')
const { parse } = require('dotenv')
const ics = require('ics')

const adeUrl = (ecole, resources) => {
    return `${process.env.ADE_BASE_URL}${ecole}?resources=${resources}`
}

const authHeader = () => {
    const username = process.env.ADE_USERNAME
    const password = process.env.ADE_PASSWORD
    return {
        'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    }
}

const fetchEvents = async (ecole, resources) => {
    return Object.values(await ical.async.fromURL(
        adeUrl(ecole, resources),
        { headers: {...authHeader()} }
    ))
}

const fetchEventsCached = async (ecole, resources) => {
    const key = ecole+resources

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
    if (match != null) {
        return match[0]
    }

    const hardValues = ['2a', 'Evenements 2A', 'seoc2a_g1']
    description_lines = description.split(/[\r\n]/)
                                    .map(l => l.trim())
                                    .filter(l => l != '')

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
    return [...courseId.matchAll(regex)][0]?.['groups'] ?? null
}

const parseResources = (resourceQuery) => {
    if (!resourceQuery) return []
    resourceQuery = Array.isArray(resourceQuery) ? resourceQuery : [resourceQuery]
    const regex = /(?<ecole>\D+)(?<ids>\d.+)/g
    const resources = resourceQuery.map(r => [...r.matchAll(regex)][0]?.['groups'])
                                    .map(r => {r.ids = r.ids.split(','); return r})
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
        if (evt.course.name == courseName) {
            return evt.course.group == group
        }
        return 1
    }
}

const hideFilter = (courseName) => {
    return (evt) => {
        if (!evt.course) return 1
        return evt.course.name != courseName
    }
}

const applyFilters = (data, filters) => {
    let events = data
    filters.forEach(f => {
        if (f.length < 2) return

        const filter_type = f[0]
        const courseName = f[1]

        switch (filter_type) {
            case 'h': //hide
                events = events.filter(hideFilter(courseName))
                break;

            case 'g': //group
            const group = f[2]
                events = events.filter(groupFilter(courseName, group))
                break;
            default:
                break;
        }
    })
    return events
}

const dateToIcsArray = (datestring) => {
    const d = new Date(datestring)
    return [d.getFullYear(), d.getMonth()+1, d.getDate(), d.getHours(), d.getMinutes()]
}

const middleware = async (req, res) => {
    const resources = parseResources(req.query.resource)
    let edt = {}
    for (const resource of Object.values(resources)) {
        for (const id of resource.ids) {
            const data = await fetchEventsCached(resource.ecole, id)
            edt = Object.assign(edt, data)
        }
    }


    const events = Object.values(edt)
        .map(event => {
            event.course = parseCourseId(findCourseId(event.description))

            return {
                summary: event.summary,
                description: event.description,
                location: event.location,
                start: event.start,
                end: event.end,
                course: event.course,
            }
            return event
        })

    const filters = parseFilters(req.query.filter)
    const filtered_events = applyFilters(events, filters)

    if (req.query.debug != null) {
        res.json({
            query: {resources, filters},
            length: filtered_events.length,
            data: filtered_events
        })
    } else {
        formatted_events = filtered_events.map(evt => {
            return {
                title: evt.summary,
                description: evt.description.trim(),
                location: evt.location,
                start: dateToIcsArray(evt.start),
                end: dateToIcsArray(evt.end),
                method: 'REQUEST'
            }
        })
        const {error,value} = ics.createEvents(formatted_events)
        if (error) console.log(error)
        res.append('content-type', 'text/calendar')
        res.append('content-disposition', 'filename="agenda.ics"')
        res.send(value)
    }
}

module.exports = {
    middleware
}