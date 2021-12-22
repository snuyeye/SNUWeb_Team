const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
    name: String,
    maxHP: { type: Number, default: 10 },
    HP: { type: Number, default: 10 },
});

const Monster = mongoose.model("Monster", schema);

module.exports = {
    Monster
};
