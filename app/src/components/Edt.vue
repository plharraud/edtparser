<template>
  <div class="row">
    <div class="col s12 l4">
      <div class="row">
        <div class="col s12">
          <div class="row">
            <form @submit.prevent="parseURL">
              <div class="input-field col s8">
                  <div class="input-field">
                    <i class="material-icons prefix">insert_link</i>
                    <input name="url" type="text">
                  </div>
              </div>
              <div class="input-field col s4">
                <button class="btn waves-effect waves-light" type="submit">
                  <i class="material-icons left">add</i>
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col s12">
          <ul>
            <li v-for="r in resources" :key="r">{{r}}</li>
          </ul>
        </div>
      </div>
      <div class="row">
        <div class="col s12">
          <table>
            <tbody>
              <tr
                v-for="(course, index) in courses"
                :key="course.name"
              >
                <td>{{ course?.name }} </td>
                <td>{{ events.find(e => e.course?.name == course.name).name }}</td>
                <td>{{ events.filter(e => e.course?.name == course.name).length }} evts.</td>
                <td
                  v-if="course.maxgroup != 'G1'"
                  class="row"
                >
                  <div class="input-field col s8">
                    <i class="material-icons prefix">group</i>
                    <i class="prefix-G">G</i>
                    <input
                      type="number"
                      min="1"
                      class="groupinput"
                      placeholder="1"
                      @input="groupFilterInput(course, $event)"
                    >
                  </div>
                  <div class="col s4">
                    <small>groupe max trouvé : {{ course.maxgroup }}</small>
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
        </div>
      </div>
    </div>
    <div class="col s12 l8">
      <div class="row">
        <div class="col s12">
          <div class="input-field col s12" @click="alert('copie')">
            <i class="material-icons prefix">content_copy</i>
            <input type="text" :value="`http://localhost:8080/ics?${urlParameters}`" disabled>
          </div>
        </div>
      </div>
      <div class="row center-align">
        <div class="col s1" />
        <div class="col s2">
          lundi
        </div>
        <div class="col s2">
          mardi
        </div>
        <div class="col s2">
          mercredi
        </div>
        <div class="col s2">
          jeudi
        </div>
        <div class="col s2">
          vendredi
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
            :key="event.name"
            :class="['card', 'grey', {'hide': isHidden(event.course)}]"
          >
            <small>{{ event.name }}</small><br>
            <small>{{ date(event.start) }} - {{ date(event.end) }}</small><br>
            <small>{{ event.location }}</small><br>
            <small>{{ event.course?.name }} {{ event.course?.group }}</small>
          </div>
        </div>
        <div class="col s1" />
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import dayjs from 'dayjs'

export default {
  data () {
    return {
      events: [],
      courses: [],
      resources: [],
      filters: [],
    }
  },
  computed: {
    resourcesUrlString () {
      return this.resources.map(r => 'resource='+ r).join('&')
    },
    urlParameters () {
      return [].concat(
        this.resources.map(r => 'resource='+ r),
        this.filters.map(f => 'filter=' + f)
      ).join('&')
    }
  },
  watch: {
    urlParameters(newParams, oldParams) {
      history.pushState(null, null, "?"+newParams);
    }
  },
  mounted () {
    this.resources = this.$route.query.resource
    if (typeof this.$route.query.filter === 'string') {
      this.filters = [this.$route.query.filter]
    } else {
      this.filters = this.$route.query.filter ?? []
    }

    axios.get('http://localhost:8080/json?' + this.resourcesUrlString)
      .then(res => {
        this.events = res.data.data.events.sort((a, b) => { return new Date(a.start) - new Date(b.start) })
        // this.courses = this.events.map(e => e.course?.name).filter((element, index, array) => array.indexOf(element) === index)
        this.courses = res.data.data.courses.sort((a, b) => { return a.name <= b.name })
      })
  },
  methods: {
    date (date) {
      return dayjs(date).format('HH:mm')// D/MM
    },
    filter_events (d) {
      return this.events.filter(e => (new Date(e.start).getDay()) === d)
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
    parseURL(e) {
      try {
        let urlString = e.target.elements.url.value
        let url = new URL(urlString)
        let params = new URLSearchParams(url.search)
        let ecole = url.pathname.split('/').pop()
        let resources = params.get('resources').split(',')
        resources = resources.map(r => ecole + r)
        resources.forEach(r => {
          if (! this.resources.includes(r))
            this.resources.push(r)
        })
        e.target.elements.url.value = ''
      } catch (err) {
        alert('url invalide')// err)
      }
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
</style>
