import SunCalc from 'suncalc';

/**
 * Get unified astronomy data for a given location and time.
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {Date} date - Custom date object (defaults to now)
 */
export function getAstronomyData(lat, lon, date = new Date()) {
  if (!lat || !lon) return null;

  const sunTimes = SunCalc.getTimes(date, lat, lon);
  const sunPos = SunCalc.getPosition(date, lat, lon);
  
  const moonIllumination = SunCalc.getMoonIllumination(date);
  const moonPos = SunCalc.getMoonPosition(date, lat, lon);
  const moonTimes = SunCalc.getMoonTimes(date, lat, lon);

  // Convert moon phase (0 to 1) into a human readable string
  // 0 = New Moon, 0.25 = First Quarter, 0.5 = Full Moon, 0.75 = Last Quarter
  let phaseName = 'New Moon';
  if (moonIllumination.phase > 0.03 && moonIllumination.phase < 0.22) phaseName = 'Waxing Crescent';
  else if (moonIllumination.phase >= 0.22 && moonIllumination.phase <= 0.28) phaseName = 'First Quarter';
  else if (moonIllumination.phase > 0.28 && moonIllumination.phase < 0.47) phaseName = 'Waxing Gibbous';
  else if (moonIllumination.phase >= 0.47 && moonIllumination.phase <= 0.53) phaseName = 'Full Moon';
  else if (moonIllumination.phase > 0.53 && moonIllumination.phase < 0.72) phaseName = 'Waning Gibbous';
  else if (moonIllumination.phase >= 0.72 && moonIllumination.phase <= 0.78) phaseName = 'Last Quarter';
  else if (moonIllumination.phase > 0.78 && moonIllumination.phase < 0.97) phaseName = 'Waning Crescent';

  return {
    sun: {
      sunrise: sunTimes.sunrise,
      sunset: sunTimes.sunset,
      altitude: sunPos.altitude,
      azimuth: sunPos.azimuth,
      isDay: sunPos.altitude > 0,
    },
    moon: {
      fraction: moonIllumination.fraction,
      phaseValue: moonIllumination.phase,
      phaseName,
      altitude: moonPos.altitude,
      azimuth: moonPos.azimuth,
      rise: moonTimes.rise,
      set: moonTimes.set
    }
  };
}
