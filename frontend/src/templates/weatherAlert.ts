import type { WorkflowDefinition } from '../types/workflow-definition'

export type WeatherTemplateOptions = {
  city: string
  thresholdC: number
}

/**
 * A real, working workflow that needs no API keys:
 *   1. geocode a city                  (Open-Meteo geocoding API)
 *   2. fetch its live temperature      (Open-Meteo forecast API)
 *   3. POST a report using both results (httpbin echo service)
 *   4. branch on the live temperature  -> heat alert / normal
 */
export function buildWeatherAlertDefinition({
  city,
  thresholdC,
}: WeatherTemplateOptions): WorkflowDefinition {
  return {
    nodes: [
      { id: 'start', type: 'START', name: 'start', position: { x: 40, y: 200 }, config: {} },
      {
        id: 'geocodeCity',
        type: 'API_REQUEST',
        name: 'geocodeCity',
        position: { x: 270, y: 200 },
        config: {
          method: 'GET',
          url: `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
        },
      },
      {
        id: 'fetchWeather',
        type: 'API_REQUEST',
        name: 'fetchWeather',
        position: { x: 500, y: 200 },
        config: {
          method: 'GET',
          url: 'https://api.open-meteo.com/v1/forecast?latitude={{geocodeCity.body.results.0.latitude}}&longitude={{geocodeCity.body.results.0.longitude}}&current=temperature_2m,relative_humidity_2m,wind_speed_10m',
        },
      },
      {
        id: 'sendReport',
        type: 'API_REQUEST',
        name: 'sendReport',
        position: { x: 730, y: 200 },
        config: {
          method: 'POST',
          url: 'https://httpbin.org/post',
          body: '{"city":"{{geocodeCity.body.results.0.name}}","temperatureC":{{fetchWeather.body.current.temperature_2m}},"humidity":{{fetchWeather.body.current.relative_humidity_2m}}}',
        },
      },
      {
        id: 'checkHeat',
        type: 'CONDITION',
        name: 'checkHeat',
        position: { x: 960, y: 200 },
        config: { expression: `{{fetchWeather.body.current.temperature_2m}} >= ${thresholdC}` },
      },
      { id: 'heatAlert', type: 'END', name: 'Heat alert raised', position: { x: 1230, y: 70 }, config: {} },
      { id: 'coolDown', type: 'DELAY', name: 'coolDown', position: { x: 1230, y: 330 }, config: { ms: 2000 } },
      { id: 'allClear', type: 'END', name: 'Weather normal', position: { x: 1460, y: 330 }, config: {} },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'geocodeCity' },
      { id: 'e2', source: 'geocodeCity', target: 'fetchWeather' },
      { id: 'e3', source: 'fetchWeather', target: 'sendReport' },
      { id: 'e4', source: 'sendReport', target: 'checkHeat' },
      { id: 'e5', source: 'checkHeat', target: 'heatAlert', sourceHandle: 'yes' },
      { id: 'e6', source: 'checkHeat', target: 'coolDown', sourceHandle: 'no' },
      { id: 'e7', source: 'coolDown', target: 'allClear' },
    ],
  }
}
