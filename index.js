const express = require('express');
const app = express();
const { ethers } = require("ethers");
app.use(express.static('public'))
app.set('view engine', 'ejs')
const web3 = require('web3');
const Influx = require('influx');
const { consoleLogger } = require('@influxdata/influxdb-client');
var BigNumber = require('big-number');
const influx = new Influx.InfluxDB({
    host: process.env.INFLUX_HOST || 'localhost',
    database: 'price_history_db',
    schema: [
        {
        measurement: 'trade',
        fields: {
            price: Influx.FieldType.FLOAT,
            size: Influx.FieldType.INTEGER
        },
        tags: [
            'symbol',
            'side'
        ]
        }
    ]
});
// const influx = new Influx.InfluxDB({
//     host: process.env.INFLUX_HOST || 'f444a871-16c8-400d-8cbd-15b141fd3de3.uptether-chart-2754.influxdb.dbs.scalingo.com:31504',
//     database: 'uptether_chart_2754',
//     username: 'billy93',
//     password: 'abcd1234',
//     schema: [
//         {
//         measurement: 'trade',
//         fields: {
//             price: Influx.FieldType.FLOAT,
//             size: Influx.FieldType.INTEGER
//         },
//         tags: [
//             'symbol',
//             'side'
//         ]
//         }
//     ]
// });

function genRand(min, max, decimalPlaces) {  
    var rand = Math.random()*(max-min) + min;
    var power = Math.pow(10, decimalPlaces);
    return Math.floor(rand*power) / power;
}

const now = new Date().getTime() * 1000;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function dummyPrice(){
    for(var i=0;i<120; i++){
        let tm = 0;
        if(i > 0) {
            tm += 1000000 * i;
        }
        // 1 second
        // const timestamp = (1000000*i);
        // 10 second
        // const timestamp = (10000000000*i);
        // 100 second
        // const timestamp = (100000000000*i);

        const price = genRand(0, 1, 2);
        const trade = {
            symbol:"USDTupUSDT",
            side:"buy",
            price:price,
            size:1,
            timestamp: now - tm
        };
        
        influx.writePoints([
            {
            measurement: 'trade',
            tags: {
                symbol: trade.symbol,
                side: trade.side
            },
            fields: { 
                price: trade.price, size: trade.size
            },
            timestamp: trade.timestamp
            }
        ], {
            precision: 'u'
        });
        await sleep(10);
    }

    console.log("Finish")
}


async function getPrice(){
    const provider = new ethers.providers.JsonRpcProvider("https://rpc-mainnet.maticvigil.com");
    const address = "0x04A2fAB8dD40EEE62A12ce8692853e291ddbF54A";
    const abi = '[{"inputs":[{"internalType":"contract IERC31337","name":"_eliteToken","type":"address"},{"internalType":"contract RootedToken","name":"_rootedToken","type":"address"},{"internalType":"contract IUniswapV2Router02","name":"_uniswapV2Router","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"}],"name":"buyRooted","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"token","type":"address"}],"name":"recoverTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"}],"name":"sellRooted","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]';
    var contract = new ethers.Contract(address,abi,provider);

    var inputAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
    var outputAddress = "0xCb5f72d37685C3D5aD0bB5F982443BC8FcdF570E";

    while(true){
        let value = await contract.getAmountsIn(1, [outputAddress, inputAddress])
        var price = 1/ethers.utils.formatUnits(value[0], 'szabo');
        console.log(price);
        const now1 = new Date().getTime() * 1000;
        const trade = {
            symbol:"USDTupUSDT",
            side:"buy",
            price:price,
            size:1,
            timestamp: now1
        };
        
        influx.writePoints([
            {
            measurement: 'trade',
            tags: {
                symbol: trade.symbol,
                side: trade.side
            },
            fields: { 
                price: trade.price, size: trade.size
            },
            timestamp: trade.timestamp
            }
        ], {
            precision: 'u'
        });

        let query = 'SELECT MIN(price) as low, MAX(price) as high, FIRST(price) as open, LAST(price) as close, SUM(size) as volume INTO "price_1m" FROM "trade" GROUP BY time(1m), symbol';
        influx.query(query).then( result => { console.log("Success1") }).catch( error => console.log("Error ", error) );

        query = 'SELECT MIN(price) as low, MAX(price) as high, FIRST(price) as open, LAST(price) as close, SUM(size) as volume INTO "price_5m" FROM "trade" GROUP BY time(5m), symbol';
        influx.query(query).then( result => { console.log("Success2") }).catch( error => console.log("Error ", error) );

        query = 'SELECT MIN(price) as low, MAX(price) as high, FIRST(price) as open, LAST(price) as close, SUM(size) as volume INTO "price_15m" FROM "trade" GROUP BY time(15m), symbol';
        influx.query(query).then( result => { console.log("Success3") }).catch( error => console.log("Error ", error) );

        query = 'SELECT MIN(price) as low, MAX(price) as high, FIRST(price) as open, LAST(price) as close, SUM(size) as volume INTO "price_1h" FROM "trade" GROUP BY time(1h), symbol';
        influx.query(query).then( result => { console.log("Success4") }).catch( error => console.log("Error ", error) );

        // query = 'SELECT MIN(price) as low, MAX(price) as high, FIRST(price) as open, LAST(price) as close, SUM(size) as volume INTO "price_6h" FROM "trade" GROUP BY time(6h), symbol';
        // influx.query(query).then( result => { console.log("Success5") }).catch( error => console.log("Error ", error) );

        // query = 'SELECT MIN(price) as low, MAX(price) as high, FIRST(price) as open, LAST(price) as close, SUM(size) as volume INTO "price_1d" FROM "trade" GROUP BY time(1d), symbol';
        // influx.query(query).then( result => { console.log("Success6") }).catch( error => console.log("Error ", error) );

        // query = 'SELECT MIN(price) as low, MAX(price) as high, FIRST(price) as open, LAST(price) as close, SUM(size) as volume INTO "price_7d" FROM "trade" GROUP BY time(7d), symbol';
        // influx.query(query).then( result => { console.log("Success7") }).catch( error => console.log("Error ", error) );
        await sleep(10000);
    }
}
// dummyPrice();
getPrice();

app.listen(3000, function() {
    console.log('listening on 3000')
});
app.get('/', (req, res) => {
    let tf = "1h";
    if(req.query.tf != null){
        tf = req.query.tf;
    }

    let query = "select * from price_"+tf+" order by time asc";
    console.log(query);
    influx.query(query)
    .then( result => {
        let results = [];

        for(var x=0;x<result.length;x++){
            results.push({
                time: new Date(result[x].time).getTime() / 1000,
                open: result[x].open,
                low: result[x].low,
                close: result[x].close,
                high: result[x].high
            });
        }
        res.render('index.ejs', { 
            chartData: results,
            tf:tf
        })
    })
    .catch( error => res.status(500).json({ error }) );

    // res.render('index.ejs', { 
    //     //chartData: results 
    // })
})
