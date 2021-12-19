const fs = require("fs");
const path = require('path');

class Manager {
    constructor() {}
}

class ConstantManager extends Manager {
    constructor(datas) {
        super();
        this.gameName = datas.gameName;
    }
}

class MapManager extends Manager {
    constructor(datas) {
        super();
        this.id = datas.id;
        this.fields = {};

        datas.settings.forEach((arrValue) => {
            this.fields[`${arrValue.fields[0]}_${arrValue.fields[1]}`] = {
                x: arrValue.fields[0],
                y: arrValue.fields[1],
                description: arrValue.fields[3],
                canGo: arrValue.fields[2],
                events: arrValue.fields[4]
            };
        });
    }

    getField(x, y) {
        return this.fields[`${x}_${y}`];
    }
}
const constantManager = new ConstantManager(
    JSON.parse(fs.readFileSync(__dirname + "/constants.json"))
);

const mapManager = new MapManager(
    JSON.parse(fs.readFileSync(__dirname + "/map.json"))
);

module.exports = {
    constantManager,
    mapManager
};
