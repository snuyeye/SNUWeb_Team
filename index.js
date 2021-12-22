const express = require("express");
const fs = require("fs");
const mongoose = require("mongoose");
const crypto = require("crypto");

const { constantManager, mapManager } = require("./Datas/Manager");
const { Player } = require("./models/Player");
const { Item } = require("./models/item");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.engine("html", require("ejs").renderFile);

mongoose.connect(
    "mongodb+srv://test0:test0@cluster0.flaec.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
);
const eventData = JSON.parse(fs.readFileSync(__dirname + "/Datas/events.json"));
const battleData = JSON.parse(fs.readFileSync(__dirname + "/Datas/monsters.json"));
const itemData = JSON.parse(fs.readFileSync(__dirname + "/Datas/items.json"));
const authentication = async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) return res.sendStatus(401);
    const [bearer, key] = authorization.split(" ");
    if (bearer !== "Bearer") return res.sendStatus(401);
    const player = await Player.findOne({ key });
    if (!player) return res.sendStatus(401);

    req.player = player;
    next();
};

app.get("/", (req, res) => {
    res.render("index", { gameName: constantManager.gameName });
});

app.get("/game", (req, res) => {
    res.render("game");
});

app.post("/signup", async (req, res) => {
    const { name } = req.body;

    if (await Player.exists({ name })) {
        return res.status(400).send({ error: "Player already exists" });
    }

    const player = new Player({
        name,
        maxHP: 10,
        HP: 10,
        str: 5,
        def: 5,
        x: 0,
        y: -1
    });


    const key = crypto.randomBytes(24).toString("hex");
    player.key = key;

    await player.save();

    return res.send({ key });
});

app.post("/action", authentication, async (req, res) => {
    const { action } = req.body;
    console.log("action:", req.body);
    const player = req.player;
    let monster = null;
    let event = null;
    let battleEvent = null;
    let field = null;
    let actions = [];
    let battleActions = [];
    if (action === "query") {
        field = mapManager.getField(req.player.x, req.player.y);
    } else if (action === "fight") {
        const {fightNumber, monster} = req.body;
        fightNumber++;
        player.hp -= monster.str * 0.2;
        monster.hp -= player.str * 1.0;
        if(monster.hp <= 0) {
            battleEvent = {description: `${monster.name}를 처치했다!`};
            player.exp += monster.exp;
        }
        battleActions.push({
            url: "/action",
            text: '공격!',
            params: { fightNumber: fightNumber, action: "fight" }
        })
        if (fightNumber > 10 || player.hp<0.2*player.maxHP) {
            battleActions.push({
                url: "/action",
                text: '도망가자!',
                params: { fightNumber: fightNumber, action: "run" }
            })
        }
        await player.save();
        await monster.save();
    } else if(action === "run") {

    } else if (action === "restat") {
        field = mapManager.getField(0, -1);
        player.maxHP = Math.round(10 * Math.random() + 5);
        player.str = Math.round(4 * Math.random() + 3);
        player.def = Math.round(4 * Math.random() + 3);
        player.HP = player.maxHP;
        const resetCount = player.incrementCOUNT();
        event = {
        title: "",
        description: `스탯이 재분배되었습니다. ( 재분배 가능횟수 : ${resetCount}/5 ) `
        };

        await player.save();
    } else if (action === "move") {
        const direction = parseInt(req.body.direction, 0); // 0 동. 1 서 . 2 남. 3 북.
        let x = req.player.x;
        let y = req.player.y;
        if (direction === 0) {
            x += 1;
        } else if (direction === 1) {
            x -= 1;
        } else if (direction === 2) {
            y -= 1;
        } else if (direction === 3) {
            y += 1;
        } else {
            res.sendStatus(400);
        }

        field = mapManager.getField(x, y);
        if (!field) res.sendStatus(400);
        player.x = x;
        player.y = y;
        const events = field.events;

        const actions = [];
        if (events.length > 0) {
            // TODO: 확률별로 이벤트 발생하도록 변경
            // TODO: 이벤트 별로 events.json 에서 불러와 이벤트 처리
            let eventPercentage = Math.random()*100;
            let cumNum = 0;
            let _event = 0;
            let i = 0;
            for (i=0;i<events.length;i++) {
                //let cumNum = parseFloat(events[i].percent);
                _event = events[i];
                console.log(field);
                if (eventPercentage < _event.percent) {
                    let idJson = null;
                    if (_event.type === 'event') {
                        eventData.data.forEach(json => {
                            if(json.id === _event.idNumber){
                                event = {description: json.content};
                                idJson = json;
                            } else{
                                event = 1;
                            }
                        })
                        if (Object.keys(idJson)[2] === "hp"){
                            player.incrementHP(idJson.hp);
                            if(player.HP <= 0){
                                player.x = 0;
                                player.y = 0;
                                player.exp = 0;
                                player.HP = player.maxHP;
                            }
                        } else if (Object.keys(idJson)[2] === "str") {
                            player.incrementSTR(idJson.str);
                        } else if (Object.keys(idJson)[2] === "exp") {
                            player.incrementEXP(idJson.exp);
                        }
                    } else if (_event.type === 'battle') {
                        battleData.data.forEach(json => {
                            if (json.id === _event.idNumber) {
                                event = {description: json.content};
                                monster = json;
                                if (monster.hp >= 0) {
                                    battleEvent = {description: `야생의 ${monster.name}가 나타났다!`};
                                    let i = 0
                                    battleActions.push({
                                        url: "/action",
                                        text: '공격!',
                                        params: {fightNumber: i, action: "fight", monster: monster}
                                    })
                                }
                            }
                        })
                    } else if (_event.type === 'item') {
                        let idJson = '';
                        itemData.data.forEach(json => json.id === _event.idNumber ? idJson = json : 1);
                        event = {description: `${idJson.name}을 획득했다!`};
                        const newItem = new Item({itemId: idJson.id, player});
                        await newItem.save();
                    }
                    break;
                } else {
                    _event = 0;
                    event = { description: "아무일도 일어나지 않았다." };
                }
            }
        }
        await player.save();
    }
    field.canGo.forEach((direction, i) => {
        if (direction === 1) {
            let dir = null;
            if(i===0) dir = '동';
            if(i===1) dir = '서';
            if(i===2) dir = '남';
            if(i===3) dir = '북';
            actions.push({
                url: "/action",
                text: dir,
                params: { direction: i, action: "move" }
            });
        }
    })

    const items = await Item.find({ player });
    let itemsTotal = [];
    console.log(items)
    items.forEach(item => itemData.data.forEach(eachItem => eachItem.id === item.itemId? itemsTotal.push(eachItem): 1))
    console.log(itemsTotal)
    return res.send({ player, field, event, actions, battleActions, itemsTotal, battleEvent, monster});

});

app.listen(3000);
