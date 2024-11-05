const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    service: String,
    title: String,
    count: Number,
    area: String,
    url: String,
    content: String,
    created_at: Date,
    updated_at: Date
});

module.exports = mongoose.model('trendings_data', schema)
