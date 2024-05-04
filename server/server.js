const express = require("express");
const path = require("path");
const fs = require("fs");
const { parse } = require("csv-parse");
const morgan = require('morgan');


const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));
app.use(morgan('combined'));

const dataFolder = path.join(__dirname, "../../data/");

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

app.get("/run/:filename", async (req, res) => {
    let filename = req.params.filename;
    if (!filename.endsWith(".csv")) {
        filename += ".csv";
    }
    const filepath = path.join(dataFolder, filename);

    try {
        // Check if the file exists
        if (!fs.existsSync(filepath)) {
            return res.status(404).send("File not found.");
        }

        const jsonData = [];
        const parser = fs.createReadStream(filepath).pipe(parse({
            columns: true,
            trim: true
        }));

        parser.on("data", (row) => {
            jsonData.push(row);
        }).on("end", () => {
            res.json(jsonData);
        }).on("error", (err) => {
            console.error(err);
            res.status(500).send("Error processing the CSV file.");
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error.");
    }
});

// Endpoint to download a specific run as a CSV file
app.get("/download/:filename", (req, res) => {
    let filename = req.params.filename;
    if (!filename.endsWith(".csv")) {
        filename += ".csv";
    }
    const filepath = path.join(dataFolder, filename);

    try {
        // Check if the file exists
        if (!fs.existsSync(filepath)) {
            return res.status(404).send("File not found.");
        }
        res.download(filepath, filename, (err) => {
            if (err) {
                console.error(err);
                res.status(500).send("Error downloading the file.");
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error.");
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}.\nVisit http://localhost:${PORT} in your browser or http://YourLocalIP:${PORT} from a different device on the same network.`));
