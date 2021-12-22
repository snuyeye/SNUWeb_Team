const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
    name: String,
    key: String,
    resetCount : Number,

    level: { type: Number, default: 1 },

    maxHP: { type: Number, default: 10 },
    maxExp: { type: Number, default: 10 },
    HP: { type: Number, default: 10 },
    str: { type: Number, default: 5 },
    def: { type: Number, default: 5 },
    exp: { type: Number, default: 0 },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    items: [{ type: Schema.Types.ObjectId, ref: 'Item' }],
});
schema.methods.incrementHP = function (val) {
    const hp = this.HP + val;
    this.HP = Math.min(Math.max(0, hp), this.maxHP);
};

schema.methods.incrementSTR = function (val) {
    const str = this.str + val;
    this.str = Math.max(0, str);
};

schema.methods.incrementEXP = function (val) {
    const exp = this.exp + val;
    this.exp = Math.max(0, exp);
    if (this.exp >= this.maxExp){
        this.level +=1;
        this.exp -= this.maxExp
        this.str +=1;
        this.def +=1;
        this.maxHP +=1;
        this.HP +=1;
    }
};

schema.methods.incrementCOUNT = function () {
  this.resetCount += 1;
  return this.resetCount;
};

const Player = mongoose.model("Player", schema);

module.exports = {
    Player
};
