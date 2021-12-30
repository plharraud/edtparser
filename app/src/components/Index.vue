<template>
  <div class="row">
    <div class="col s6">
      <div
        v-for="course in courses"
        :key="course"
        class="card"
      >
        <p>{{ course }}</p>
        <input type="checkbox">
      </div>
    </div>
    <div class="col s6">
      <div class="row">
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
            class="card"
          >
            <p>{{ event.name }}</p>
            <p>{{ date(event.start) }} - {{ date(event.end) }}</p>
            <p>{{ event.location }}</p>
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
      courses: []
    }
  },
  computed: {
  },
  mounted () {
    axios.get('http://localhost:8080/json' + window.location.search)
      .then(res => {
        this.events = res.data.data.sort((a, b) => { return new Date(a.start) - new Date(b.start) })
        this.courses = this.events.map(e => e.course?.name).filter((element, index, array) => array.indexOf(element) === index)
        console.log(this.courses)
      })
  },
  methods: {
    date (date) {
      return dayjs(date).format('D/MM HH:mm')
    },
    filter_events (d) {
      return this.events.filter(e => (new Date(e.start).getDay()) === d)
    }
  }
}
</script>
