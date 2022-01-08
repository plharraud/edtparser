<template>
  <div class="row">
    <div class="col s12 l8 push-l4">
      <div class="row">
        <div class="col s12 center-align">
          <ul class="pagination">
            <li
              v-for="w in weeks"
              :key="w"
              :class="{'active': currentWeek == w}"
            >
              <a @click="() => {currentWeek = w}">{{ w-1 }}</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="row center-align">
        <div class="col s1" />
        <div
          v-for="day in [1,2,3,4,5]"
          :key="day"
          class="col s2"
        >
          {{ dayAndDate(currentWeek, day) }}
        </div>
        <div class="col s1" />
      </div>
      <div class="row">
        <div class="col s1" />
        <div
          v-for="day in [1,2,3,4,5]"
          :key="day"
          class="col s2"
        >
          <div
            v-for="event in filter_events(day)"
            :key="event.id"
            :class="['card', getColor(event.origin), {'hide': isHidden(event?.course)}]"
          >
            <small>{{ event.name }}</small>
            <small>{{ date(event.start) }} - {{ date(event.end) }}</small>
            <small>{{ event.location }}</small>
            <small>{{ event.course?.name }} {{ event.course?.type }} {{ event.course?.group }}</small>
          </div>
        </div>
        <div class="col s1" />
      </div>
    </div>

    <div class="col s12 l4 pull-l8">
      <h5 class="hide-on-med-and-down center-align">
        ADE Filter
      </h5>
      <ul class="collapsible expandable">
        <li>
          <div class="collapsible-header">
            <i class="material-icons">tune</i> Filtres
          </div>
          <div class="collapsible-body">
            <span>
              <table>
                <tbody>
                  <tr
                    v-for="course in courses"
                    :key="course.name"
                    :class="{'course-hidden': filters.find(v => v === 'h,'+course.name)}"
                  >
                    <td>
                      {{ course.name }}
                      <span
                        class="new badge grey"
                        data-badge-caption="evts."
                      >
                        {{ events.filter(e => e.course?.name == course.name).length }}
                      </span>
                      <br>
                      <small>{{ events.find(e => e.course?.name == course.name).name }}</small>
                    </td>
                    <td
                      v-if="course.maxgroup != 'G1'"
                      class="row"
                    >
                      <div class="input-field col s12">
                        <i class="material-icons prefix">group</i>
                        <i class="prefix-G">G</i>
                        <input
                          type="number"
                          min="1"
                          class="groupinput"
                          placeholder="1"
                          :v-model="filterGroups[course.name]"
                          @input="groupFilterInput(course, $event)"
                        >
                        <small>max trouvé: {{ course.maxgroup }}</small>
                      </div>
                    </td> <td v-else />
                    <td class="right-align">
                      <label class="check">
                        <input
                          v-model="filters"
                          type="checkbox"
                          :value="'h,'+course?.name"
                        >
                        <i class="small material-icons unchecked">visibility</i>
                        <i class="small material-icons checked">visibility_off</i>
                      </label>
                    </td>
                  </tr>
                </tbody>
              </table>
              <!--TODO afficher les filtres actifs mais dont le cours est pas detecté-->
            </span>
          </div>
        </li>
        <li>
          <div class="collapsible-header">
            <i class="material-icons">event</i> Calendriers
          </div>
          <div class="collapsible-body">
            <span>
              <form @submit.prevent="parseURL">
                <div class="input-field">
                  <i class="material-icons prefix">insert_link</i>
                  <input
                    name="url"
                    type="text"
                    placeholder="https://edt.grenoble-inp.fr/directCal/2021-2022/etudiant/phelma?resources="
                  >
                </div>
              </form>
              <ul>
                <li
                  v-for="r in resources"
                  :key="r"
                >
                  {{ r }} <a
                    href=""
                    @click.prevent="removeResource(r)"
                  >supprimer</a>
                </li>
              </ul>
            </span>
          </div>
        </li>
        <li>
          <div class="collapsible-header">
            <i class="material-icons">link</i> Exporter
          </div>
          <div class="collapsible-body">
            <span>
              URL ICal
              <div class="input-field">
                <i
                  class="material-icons prefix"
                  style="cursor: pointer"
                  @click="clip(icsUrl)"
                >content_copy</i>
                <input
                  type="text"
                  :value="icsUrl"
                  @click="$event.target.select()"
                >
              </div>
            </span>
          </div>
        </li>
        <li>
          <div class="collapsible-header">
            <i class="material-icons">help_outline</i> Utilisation
          </div>
          <div class="collapsible-body">
            <span>
              <p>
                ADE Filter permet de fusionner plusieurs calendriers ADE et de filtrer les cours<br>
              </p>
              Importer un calendrier
              <ol>
                <li>
                  sur <a
                    href="https://edt.grenoble-inp.fr/"
                    target="blank"
                  >ADE</a> choisir l'école (pas EXTERIEUR)
                </li>
                <li>
                  choisir le calendrier
                </li>
                <li>
                  <i>Agenda export</i> en bas a gauche
                </li>
                <li>
                  <i>Generate URL</i>
                </li>
                <li>
                  coller l'url dans <i class="material-icons">event</i> Calendriers (Entrée pour valider) <br>
                  on peut aussi utiliser le format ecoleCODE,... (ex: phelma9796,9760)
                  <ul class="dashed">
                    <li>ecole : le nom de l'ecole</li>
                    <li>CODE : la liste des identifiants de calendrier (séparés par des ,)</li>
                  </ul>
                </li>
              </ol>
              <p>
                <a
                  href="https://prism.minatec.grenoble-inp.fr/images/doc/Synchroniser%20son%20calendrier%20avec%20ADE.pdf"
                  target="blank"
                >
                  Instructions de synchronisation sur Android
                </a>
              </p>
            </span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import dayjs from 'dayjs'
import M from 'materialize-css'
import weekOfYear from 'dayjs/plugin/weekOfYear'
dayjs.extend(weekOfYear)

export default {
  name: 'Edt',
  data () {
    return {
      events: [],
      courses: [],
      resources: [],
      filters: [],
      filterGroups: [],
      weeks: [],
      currentWeek: -1,
      colors: [
        'green',
        'red',
        'blue'
      ],
      base: '',
      oldResource: []
    }
  },
  computed: {
    resourcesUrlString () {
      return this.resources.map(r => 'resource=' + r).join('&')
    },
    urlParameters () {
      return [].concat(
        this.resources.map(r => 'resource=' + r),
        this.filters.map(f => 'filter=' + f)
      ).join('&')
    },
    icsUrl () {
      return `${this.base}ics?${this.urlParameters}`
    }
  },
  watch: {
    urlParameters (newR, old) {
      this.$router.push('?' + this.urlParameters)
    },
    '$route.query.resource': function (newResource, oldResource) {
      if (JSON.stringify(newResource) !== JSON.stringify(oldResource)) {
        this.resources = (typeof newResource === 'string' ? [newResource] : newResource) ?? []
        this.fetchEvents()
      }
    },
    '$route.query.filter': function (newFilter, oldFilter) {
      if (typeof this.$route.query.filter === 'string') {
        this.filters = [this.$route.query.filter]
      } else {
        this.filters = this.$route.query.filter ?? []
      }
    }
  },
  mounted () {
    this.base = import.meta.env.VITE_BASE_URL
    if (typeof this.$route.query.filter === 'string') {
      this.filters = [this.$route.query.filter]
    } else {
      this.filters = this.$route.query.filter ?? []
    }
    if (typeof this.$route.query.resource === 'string') {
      this.resources = [this.$route.query.resource]
    } else {
      this.resources = this.$route.query.resource ?? []
    }
    this.fetchEvents()
    M.Collapsible.init(document.querySelectorAll('.collapsible'), { accordion: false })
  },
  methods: {
    fetchEvents () {
      axios.get(import.meta.env.VITE_BASE_URL + 'json?' + this.resourcesUrlString)
        .then(res => {
          this.events = res.data.data.events.sort((a, b) => { return new Date(a.start) - new Date(b.start) })
          this.courses = res.data.data.courses.sort((a, b) => { return a.name >= b.name ? 1 : -1 })
          this.fillWeeks()
        })
    },
    fillWeeks () {
      if (this.events.length === 0) return
      const min = dayjs(this.events[0].start).week()
      const max = dayjs(this.events[this.events.length - 1].start).week()
      this.weeks = []
      this.currentWeek = this.currentWeek === -1 ? min : this.currentWeek
      for (let i = min; i <= max; i++) {
        this.weeks.push(i)
      }
    },
    date (date) {
      return dayjs(date).format('HH:mm')// D/MM
    },
    filter_events (d) {
      return this.events
        .filter(e => {
          return (new Date(e.start).getDay() === d &&
            dayjs(e.start).week() === this.currentWeek)
        })
    },
    isHidden (course) {
      if (!course) return false
      if (this.filters.includes(`h,${course.name}`)) return true
      if (this.filters.filter(f => f.includes(`g,${course.name}`)).length > 0) {
        const groupFilter = this.filters.filter(f => f.includes(`g,${course.name}`))[0]
        if (groupFilter === `g,${course.name},${course.group}`) {
          return false
        }
        return true
      }
      return false
    },
    groupFilterInput (course, event) {
      // supprime le filtre courant
      const index = this.filters.findIndex(v => v.includes(course.name))
      if (index > -1) {
        this.filters.splice(index, 1)
      }

      // rajoute le filtre supprimé
      const groupNumber = parseInt(event.target.value, 10)
      if (!isNaN(groupNumber) && groupNumber > 0) { // groupe valide
        this.filters.push(`g,${course.name},G${groupNumber}`)
      }
    },
    parseURL (e) {
      const inputValue = e.target.elements.url.value.trim()
      let url
      let resources = []
      try {
        url = new URL(inputValue)
      } catch (err) {
      }

      const regex = /(?<ecole>[a-z]+)(?<ids>[\d,]+)+/g
      const regresult = [...inputValue.matchAll(regex)][0]?.groups

      if (url !== undefined) {
        const params = new URLSearchParams(url.search)
        resources = params.get('resources').split(',')
        const ecole = url.pathname.split('/').pop()
        resources = resources.map(r => ecole + r)
      } else if (regresult !== undefined) {
        resources = regresult.ids.split(',').map(r => regresult.ecole + r)
      } else {
        alert('url ou code invalide')
        return
      }

      resources.forEach(r => {
        if (!this.resources.includes(r)) { this.resources = this.resources.concat([r]) }
      })

      e.target.elements.url.value = ''
    },
    getColor (origin) {
      const index = this.resources.findIndex(v => v === origin)
      if (index === -1) { return 'grey' }
      return this.colors[index % this.colors.length]
    },
    clip (text) {
      window.navigator.clipboard.writeText(text)
    },
    dayAndDate (weekNumber, dayNumber) {
      const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']
      return days[dayNumber - 1] + ' ' + dayjs().week(weekNumber).day(dayNumber).date()
    },
    removeResource (r) {
      this.resources = this.resources.filter(res => res !== r)
    }

  }
}
</script>

<style>
.check {
  user-select: none;
  cursor: pointer;
  color: black;
}
.check input {
  display: none;
}
.check input ~ .checked {
  display: none;
}
.check input:checked ~ .checked {
  display: inline-block;
}
.check input:checked ~ .unchecked {
  display: none;
}

tr.course-hidden {
  opacity: 60%;
  background-color: #eee;
}

.prefix-G {
  position: absolute;
  font-size: 16px !important;
  top: .7rem !important;
  left: 2.9rem;
}

.input-field {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.groupinput {
  margin-bottom: 0 !important;
}

ul.pagination {
  cursor: pointer;
  user-select: none;
}

.card small {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  display: block;
}

.card:hover small {
  text-overflow:unset;
  white-space:normal;
}

.material-icons {
  vertical-align: middle;
}

ul.dashed {
  list-style-type: none;
  margin: 0;
}
ul.dashed > li:before {
  content: "-";
  margin: 0 3px 0 8px;
}
</style>
