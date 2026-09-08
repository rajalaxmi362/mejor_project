require("dotenv").config();

const mongoose = require("mongoose");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function geocodeListings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    // Get only listings that don't already have valid coordinates
    const listings = await Listing.find({
      $or: [
        { geometry: { $exists: false } },
        { "geometry.coordinates": { $exists: false } },
        { "geometry.coordinates": { $size: 0 } },
      ],
    });

    console.log(`Found ${listings.length} listings to geocode.`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const listing of listings) {
      const location = `${listing.location}, ${listing.country}`;

      console.log(`\nSearching: ${location}`);

      try {
        const response = await fetch(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(
            location
          )}.json?limit=1&key=${process.env.MAPTILER_API_KEY}`
        );

        if (!response.ok) {
          console.log(
            `MapTiler error for "${location}": ${response.status}`
          );

          failed++;
          continue;
        }

        const data = await response.json();

        // No result found
        if (!data.features || data.features.length === 0) {
          console.log(`No coordinates found for: ${location}`);
          skipped++;
          continue;
        }

        const coordinates = data.features[0].geometry.coordinates;

        // Save coordinates
        listing.geometry = {
          type: "Point",
          coordinates: [
            Number(coordinates[0]),
            Number(coordinates[1]),
          ],
        };

        await listing.save();

        console.log(
          `Updated: ${listing.title} → [${coordinates[0]}, ${coordinates[1]}]`
        );

        updated++;

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.log(`Failed: ${location}`);
        console.log(error.message);

        failed++;
      }
    }

    console.log("\n==============================");
    console.log("GEOCODING FINISHED");
    console.log("==============================");
    console.log(`Updated : ${updated}`);
    console.log(`Skipped : ${skipped}`);
    console.log(`Failed  : ${failed}`);
    console.log("==============================");

    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  } catch (error) {
    console.error("ERROR:", error);
    await mongoose.connection.close();
  }
}

geocodeListings();