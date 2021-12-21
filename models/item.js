const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
    itemId: Number,
    user: { type: Schema.Types.ObjectId, ref: "Player" }
});

const Player = mongoose.model("Player", schema);

module.exports = {
    Player
};
