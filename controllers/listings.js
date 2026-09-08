const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  console.log(listing);

  res.render("listings/show.ejs", {
    listing,
    mapToken: process.env.MAPTILER_API_KEY,
  });
};
module.exports.createListing = async (req, res) => {
  let url = req.file.path;
  let filename = req.file.filename;

  const newListing = new Listing(req.body.listing);

  newListing.owner = req.user._id;
  newListing.image = { url, filename };

  // Geocoding using MapTiler
  const location = `${req.body.listing.location}, ${req.body.listing.country}`;

  try {
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(
        location
      )}.json?key=${process.env.MAPTILER_API_KEY}&language=en&limit=1`
    );

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      newListing.geometry = {
        type: "Point",
        coordinates: data.features[0].geometry.coordinates,
      };
    }
  } catch (error) {
    console.log("Geocoding failed:", error);
  }

  await newListing.save();

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};
module.exports.renderEdiForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(req.params.id).populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
