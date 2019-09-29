const mongoose = require('mongoose')

const {database} = require('./keys')

mongoose.connect(database.URI,{
    useUnifiedTopology: true
})
.then (db => console.log('DB is connected'))
.catch(err => console.error(err))