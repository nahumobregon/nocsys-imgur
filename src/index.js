const express = require('express')

const config = require('./server/config')

//Nos conectamos a la base de datos
require('./database')

//starting server
const app = config(express())


app.listen(app.get('port'), ()=>{
    console.log('Server on port' , app.get('port'))
})