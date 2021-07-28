//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const _ = require("lodash");

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: true }));

mongoose
  .connect(
    "mongodb://127.0.0.1:27017/todolistDB?directConnection=true&serverSelectionTimeoutMS=2000",
    { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
  )
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => console.log(err));

const itemsSchema = new mongoose.Schema({
  name: String,
});

const listSchema = mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

const Item = mongoose.model("Item", itemsSchema);

const shopping = new Item({ name: "Shopping" });
const exercising = new Item({ name: "Exercising" });
const coding = new Item({ name: "Coding" });
const defaultItems = [shopping, exercising, coding];

const workItems = [];
const day = date.getDate();

app.get("/", async function (req, res) {
  await Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, () => {});
      res.redirect("/");
    } else {
      res.render("list", { listTitle: day, newListItems: foundItems });
    }
  });
});

app.get("/:customListName", async function (req, res){
  const customListName = _.capitalize(req.params.customListName);
  await List.findOne({name: customListName}, async function(err, foundList){
    if(!foundList){
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      await list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if(listName === day){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function (req, res) {
  const itemId = req.body.itemId;
  const listName = req.body.listName;

  if(listName === day){
    Item.findByIdAndRemove(itemId, (err) => {});
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: { _id: itemId} }}, err => {res.redirect("/" + listName)})
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
