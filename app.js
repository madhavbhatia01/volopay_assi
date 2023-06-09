import Papa from "papaparse";
import fs from "fs";
import express from 'express';

//converting csv data to an array of objects
function getDataFromCSV() {
  return new Promise((resolve, reject) => {
    fs.readFile("data.csv", 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      const result = Papa.parse(data, {});
      var arr = [];
      for(var i=1 ; i<result.data.length ; i++){
        arr.push({
          id: parseInt(result.data[i][0]),
          date: new Date(result.data[i][1]),
          user : result.data[i][2],
          department: result.data[i][3],
          software: result.data[i][4],
          seats: parseInt(result.data[i][5]),
          amount: parseInt(result.data[i][6])
        });
      }
      resolve(arr);
    });
  });
}


const app = express();
app.use(express.urlencoded({ extended: true }));


//api1
app.get("/api/total_items", (req, res)=>{
  getDataFromCSV().then(arr => {
    let stDate = new Date(req.body.start_date);
    let enDate = new Date(req.body.end_date);
    let reqDept = req.body.department;
    let count=0;
    console.log(reqDept);
    for(let i=0 ; i<arr.length ; i++){
      if(arr[i].date>=stDate && arr[i].date<=enDate && arr[i].department === reqDept){
        count++;
      }
    }
    res.status(200).send(count.toString());
  }).catch(error => {
      console.error(error);
      res.status(400).send('Bad Request');
    });
});

//api2, assuming:
// n is also in params
// quantity, price are boolean values, and if one of them is true, other should be false, and should be passed in smallcase letters while sending parameters
app.get("/api/nth_most_total_item", (req, res)=>{
  getDataFromCSV().then(arr => {
    let stDate = new Date(req.body.start_date);
    let enDate = new Date(req.body.end_date);
    let getQuantity = req.body.quantity === 'true';
    let getPrice = req.body.price === 'true';
    let n = parseInt(req.body.n);
    var arrFilteringDates = arr.filter(obj => obj.date>=stDate && obj.date<=enDate);
    if(getQuantity){
      var map = {};
      for(var i=0 ; i<arrFilteringDates.length; i++){
        if(map[arrFilteringDates[i].software]==null){
          map[arrFilteringDates[i].software]=1;
        }else{
          map[arrFilteringDates[i].software]++;
        }
      }
      var sortedMap = new Map(Object.entries(map).sort((a,b) => b[1]-a[1]));
      for(let [key, val] of sortedMap){
        n--;
        if(n===0){
          res.status(200).send(key);
          break;
        }
      }
    }else if (getPrice) {
      var map = {};
      for(var i=0 ; i<arrFilteringDates.length; i++){
        if(map[arrFilteringDates[i].software]==null){
          map[arrFilteringDates[i].software]=arrFilteringDates[i].amount;
        }else{
          map[arrFilteringDates[i].software]+=arrFilteringDates[i].amount;
        }
      }
      var sortedMap = new Map(Object.entries(map).sort((a,b) => b[1]-a[1]));
      console.log(sortedMap);
      for(let [key, val] of sortedMap){
        n--;
        if(n===0){
          res.status(200).send(key);
          break;
        }
      }
    }
  }).catch(error => {
      console.error(error);
      res.status(400).send('Bad Request');
    });
})

//api3
app.get("/api/percentage_of_department_wise_sold_items", (req, res)=>{
  getDataFromCSV().then(arr => {
    let stDate = new Date(req.body.start_date);
    let enDate = new Date(req.body.end_date);
    const map = new Map();
    map['Tech']=0;
    map['Customer Success']=0;
    map['HR']=0;
    map['Sales']=0;
    map['Marketting']=0;
    var total_items_sold = 0;
    for(let i=0 ; i<arr.length ; i++){
      if(arr[i].date>=stDate && arr[i].date<=enDate){
        map[arr[i].department]++;
        total_items_sold++;
      }
    }
    var result = {
      tech: map['Tech']*100/total_items_sold,
      customer_success: map['Customer Success']*100/total_items_sold,
      hr: map['HR']*100/total_items_sold,
      sales: map['Sales']*100/total_items_sold,
      maketting: map['Marketting']*100/total_items_sold
    };
    res.status(200).send(result);
  }).catch(error => {
      console.error(error);
      res.status(400).send('Bad Request');
    });
});

//api4, assuming params : {name, year}
app.get("/api/monthly_sales", (req, res)=>{
  getDataFromCSV().then(arr => {
    let reqName = req.body.name;
    let reqYear = parseInt(req.body.year);
    let result = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];//for 12 months
    for(let i=0 ; i<arr.length ; i++){
      if(arr[i].software===reqName && arr[i].date.getFullYear() === reqYear){
        result[arr[i].date.getMonth()]++;
      }
    }
    res.status(200).send(result);
  }).catch(error => {
      console.error(error);
      res.status(400).send('Bad Request');
    });
});


//for any other api requests - bad request
app.get("/*", (req, res)=>{
  res.status(400).send('Bad Request');
});

app.listen(3000, function() {
  console.log("Server started");
});
