const restify = require("restify");
const corsMiddleware = require("restify-cors-middleware");
const exec = require("child_process").exec;
const fs = require("fs");
const path = require("path");

console.log("Monitor starting...");

const server = restify.createServer();

const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: [
        /^http:\/\/localhost(:[\d]+)?$/,
        "http://*.dappnode.eth",
    ]
});

server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser());

function runCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(`Running: ${command}`);

        const child = exec(command, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return reject(error.message);
            }
            if (stderr) {
                return reject(stderr);
            }
            return resolve(stdout);
        });

        child.stdout.on("data", function(data) {
            console.log(data.toString());
        });
    });
}

function runWalletCommand(command) {
    return runCommand(`wallet --format json --file /app/data/wallet.key ${command}`);
}

function runWalletCommandWithPassword(command, password) {
    return runCommand(`HELIUM_WALLET_PASSWORD=$'${password}' wallet --format json --file /app/data/wallet.key ${command}`)
}

server.post("/create/testnet", function (req, res, next) {
    if (!req.body) {
        res.send(500, "No request body!");
        return next();
    }

    if (!req.body.password) {
        res.send(500, "No password field in request!");
        return next();
    }

    runWalletCommandWithPassword("create basic --network testnet", req.body.password).then((stdout) => {
        res.send(200, JSON.parse(stdout));
    }).catch((e) => {
        res.send(500, e);
    });

    return next();
});

server.get("/info", function (req, res, next) {
    runWalletCommand("info").then((stdout) => {
        res.send(200, JSON.parse(stdout));
    }).catch((e) => {
        res.send(500, e);
    });

    return next();
});

server.get("/stake/:address/:amount", function (req, res, next) {
    runWalletCommand(`validators stake ${req.params.address} ${res.params.amount} --commit`).then((stdout) => {
        res.send(200, stdout);
    }).catch((e) => {
        res.send(500, e);
    });

    return next();
});

server.listen(82, function() {
    console.log(`${server.name} listening at ${server.url}`);
});
