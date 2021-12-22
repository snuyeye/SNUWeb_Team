const mongoose = require("mongoose");
const { Schema } = mongoose;

const monsterSchema = new Schema({
    name: String,
    HP: Number,
});

const Monster = mongoose.model("Monster", monsterSchema);

module.exports = Monster;
