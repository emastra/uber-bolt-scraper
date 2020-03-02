const Apify = require('apify');
const rp = require('request-promise-native');
const { sleep } = Apify.utils;

async function boltLogin(requestQueue, cred) {
  const info = await requestQueue.addRequest({
    url: 'https://m.bolt.eu/Map',
    userData: {
      label: 'EXTRACT-BOLT',
      cookies: cred.cookies,
      cred: cred
    }
  }, { forefront: true });

  return info;
}

async function extractBolt(coordinates, cred) {
  for (let i = 0; i < coordinates.length; i++) {
    const coords = coordinates[i];
    const fromCoords = coords[0].split(',');
    const toCoords = coords[1].split(',');
    const fromLat = fromCoords[0];
    const fromLng = fromCoords[1];
    const toLat = toCoords[0];
    const toLng = toCoords[1];

    const today = new Date();
    const date = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
    const time = `${today.getHours()}:${today.getMinutes()}`;

    const res = await rp({
      method: 'GET',
      url: `https://search.bolt.eu/findCategoriesOverview?
        version=CB.3.19
        &language=en
        &lat=${fromLat}
        &lng=${fromLng}
        &gps_accuracy=50
        &interaction_method=address_search
        &initiated_by=user
        &destination_lat=${toLat}
        &destination_lng=${toLng}`,
      headers: {
        Authorization: cred.auth
      },
      json: true
    });

    // console.log(res);
    const boltRes = res.data.search_categories.filter(obj => obj.name === 'Bolt')[0];

    const item = {
      source: 'bolt',
      date: date,
      time: time,
      route: coords,
      price: 'Prediction: ' + boltRes.price_prediction_str + ', Min: ' + boltRes.min_price_str,
      arrival: null,
      surge: boltRes.booking_fee_str
    }

    await sleep(1000);

    Apify.pushData(item);
    console.log('Pushed bolt', time, coords);
  }
}

module.exports = {
  boltLogin,
  extractBolt
}
