const express = require("express");
const path = require("path");
const fs = require("fs");
const { parse } = require("csv-parse");
const morgan = require('morgan');


const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));
app.use(morgan('combined'));

const dataFolder = path.join(__dirname, "data-runs/");

app.get("/runs", (req, res) => {
    fs.readdir(dataFolder, (err, files) => {
        if (err) {
            console.error(err);
            res.status(500).send("Error reading data runs directory.");
            return;
        }
        const runs = files.filter(file => file.endsWith(".csv")).map(file => file.slice(0, -4));
        res.json(runs);
    });
});

app.get("/run/:filename", (req, res) => {
    let filename = req.params.filename;
    if (!filename.endsWith(".csv")) {
        filename += ".csv";
    }
    const filepath = path.join(dataFolder, filename);

    const jsonData = [];
    fs.createReadStream(filepath)
        .pipe(parse({
            columns: true,  // First line of the CSV is interpreted as column names
            trim: true      // Trim leading and trailing spaces around columns
        }))
        .on("data", (row) => {
            jsonData.push(row);
        })
        .on("end", () => {
            res.json(jsonData);
        })
        .on("error", (err) => {
            console.error(err);
            res.status(500).send("Error processing the CSV file.");
        });
});

app.get("/chart.js", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/chart.js"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
