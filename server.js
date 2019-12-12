'use strict';

//DEPENDENCIES
const PORT = process.env.PORT || 3000;
const express = require('express');
const cors = require('cors');
const app = express();
const superagent = require('superagent');
app.use(cors());
require('dotenv').config();

// GLOBAL VARIABLES
let error = {
  status: 500,
  responseText: 'Sorry, something went wrong',
}
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const EVENTBRITE_API_KEY = process.env.EVENTBRITE_API_KEY;
let locationSubmitted;

// LOCATION PATH
app.get('/location', (request, res) => {
  let query = request.query.data;

  superagent.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GEOCODE_API_KEY}`).then(response => {
    const result = response.body.results[0]
    const location = result.geometry.location;
    const formAddr = result.formatted_address;
    const searchquery = result.address_components[0].long_name.toLowerCase();
   
    locationSubmitted = new Geolocation(searchquery, formAddr, location);
    res.send(locationSubmitted);
  })

  . catch(error => {
    console.error('catch on weather ', error)
  })

});

// LOCATION CONSTRUCTOR FUNCTION
function Geolocation(searchquery, formAddr, location) {
  this.searchquery = searchquery;
  this.formatted_query = formAddr;
  this.latitude = location.lat;
  this.longitude = location.lng;
}

// WEATHER PATH
app.get('/weather', (request, response) => {
  superagent.get(`https://api.darksky.net/forecast/${WEATHER_API_KEY}/${locationSubmitted.latitude},${locationSubmitted.longitude}`).then(res => {
    const weatherArr = res.body.daily.data
    const reply = weatherArr.map(byDay => {
      return new Forecast(byDay.summary, byDay.time);
    })
    response.send(reply);
    console.log(weatherArr);

  })
  . catch(error => {
    console.error('catch on weather ', error)
  })
})

// FORECAST CONSTRUCTOR FUNCTION
function Forecast(summary, time) {
  this.forecast = summary;
  this.time = (new Date(time * 1000)).toDateString();
}

// EVENTS PATH
app.get('/events', (request, response) => {
  superagent.get(`http://api.eventful.com/json/events/search?where=${locationSubmitted.latitude},${locationSubmitted.longitude}&within=25&app_key=${EVENTBRITE_API_KEY}`).then(res => {
    let events = JSON.parse(res.text);
    let moreEvents = events.events.event
    let eventData = moreEvents.map(event => {
      return new Event(event.url, event.title, event.start_time, event.description);
    })
    response.send(eventData);
  }). catch(error => {
    console.error('catch on events ', error)
  })
})

// EVENTS CONSTRUCTOR FUNCTION
function Event(link, name, event_date, summary='none') {
  this.link = link,
  this.name = name,
  this.event_date = event_date,
  this.summary = summary
}

// LISTEN
app.listen(PORT, () => {
  console.log(`App is on PORT: ${PORT}`);
});
