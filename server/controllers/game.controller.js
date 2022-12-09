const axios = require('axios')

//include access_token, token_type, and expiration_time?
let token = {
    "access_token": process.env.ACCESS_TOKEN,
    "expires_at": process.env.EXPIRES_AT,
    "token_type": process.env.TOKEN_TYPE
}


const getToken = (id=process.env.CLIENT_ID,secret=process.env.CLIENT_SECRET) =>{
    axios.post(`https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`)
    .then((res) => {
        let expiration = Date.now() + (res.data['expires_in'] * 1000)
        token = {
            "access_token": res.data['access_token'],
            "expires_at": expiration,
            "token_type": res.data['token_type']
        }
        process.env.ACCESS_TOKEN = res.data['access_token']
        process.env.EXPIRES_AT = expiration
        process.env.TOKEN_TYPE = res.data['token_type']
        console.log(token)
    })
    .then(() => checkTokenValidity(token))
    .catch((err) => console.log(err))
}

const checkTokenValidity = (token=token) => {
    isValid = true
    Object.keys(token).length === 0 && (isValid = false)
    token.expires_at <= Date.now() && (isValid = false)
    return(isValid)
}

const searchGamesIGDB = async (query) => {
  try {
    const games = await axios({
        url: 'https://api.igdb.com/v4/games',
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Client-ID': process.env.CLIENT_ID,
            'Authorization': `${token.token_type} ${token.access_token}`,
            'Accept-Encoding': 'gzip,deflate,compress'
    },
        data: `search "${query}"; fields name, cover.url, first_release_date; limit 50;`
    });

    if(games.data){
        games.data.forEach(game => {
            let date = new Date(game.first_release_date * 1000)
            const options = { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC' };
            game.first_release_date = {
                timestamp: game.first_release_date,
                date: date.toLocaleDateString('en-US', options)
            }
        })

        return games.data
    }

  } catch (err) {
    console.log(err);
  }
}



module.exports.index = (req, res) => {
    res.json({
        message: "API Index",
    })
}

module.exports.searchIGDB = async (req, res) => {
    if(checkTokenValidity(token) === false) {
        getToken()
    }
    const results = await searchGamesIGDB(req.body['query'])
    if(!results) {
        res.status(400).json({
            message: "No games found",
        })
    }
    res.json(results)

}
