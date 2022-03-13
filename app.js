//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

let day = "";

mongoose.connect("mongodb+srv://mythri_kaulwar:Mythri123@cluster0.puuhi.mongodb.net/todoListDB", {useNewUrlParser: true});
console.log("Connected to server");

const itemsSchema = new mongoose.Schema({
    name: String
});

const listSchema = new mongoose.Schema({
    name: String, 
    items: [itemsSchema]
});

const ListModel = mongoose.model("List", listSchema);

const ItemModel = mongoose.model("Item", itemsSchema);

const item1 = new ItemModel ({name: "Welcome to your To Do List"});
const item2 = new ItemModel ({name: "Hit the '+' to add a new Item"});
const item3 = new ItemModel ({name: "<-- Hit this to delete an Item"});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res){
    let date = new Date();

    let options = {
        weekday: "long",
        day: "numeric",
        month: "long"
    };

    day = date.toLocaleDateString("en-US", options);

    ItemModel.find({}, function(err, docs){
        if(docs.length === 0){
            ItemModel.insertMany(defaultItems, function(err){
                if(err) console.log(err);
            });
        }else {
            res.render("list", {dayOfWeek: day, newItems: docs});
        }
    });
});

app.get("/:topic", function(req, res){
    const listName = _.capitalize(req.params.topic);
    ListModel.findOne({name: listName}, function(err, docs){
        if(!err){
            if(!docs) {
                const list = new ListModel({
                    name: _.capitalize(listName),
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + listName);
            }else {
                res.render("list", {dayOfWeek: req.params.topic, newItems: docs.items});
            }
        }
    });
});

app.post("/", function(req, res){
    let itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new ItemModel({name: itemName});
    
    if(listName === day){
        item.save();
        res.redirect("/");
    } else {
        ListModel.findOne({name: listName}, function(err, docs){
            docs.items.push(item);
            docs.save();
            res.redirect("/" + listName);
        })
    }
});

app.post("/delete", function(req, res){
    const itemID = req.body.checkbox;
    const nameOfList = req.body.theName;
    if(nameOfList === day){
        ItemModel.findByIdAndDelete(itemID, function(err){
            if(err) console.log(err);
            else console.log("Deleted successfully!");
        });
        res.redirect("/");
    } else {
        ListModel.findOneAndUpdate({name: nameOfList}, {$pull: {items: {_id: itemID}}}, function(err, docs){
            if(!err) res.redirect("/" + nameOfList);
        });
    }
});

app.listen(3000, function(){
    console.log("Listening to port 3000");
});