const { body, validationResult } = require("express-validator");

const Genre = require("../models/genre");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({ name: 1 }).exec();

  res.render("genre_list", {
    title: "Genre List",
    genre_list: allGenres,
  });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  // Get details of genre and all associated books ( in parallel)
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);
  if (genre === null) {
    //NO results.
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }

  res.render("genre_detail", {
    title: "Genre Detail",
    genre,
    genre_books: booksInGenre,
  });
});

// Display Genre create form on GET.
exports.genre_create_get = (req, res, next) => {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre,
        errors: errors.array(),
      });
      return;
    }
    // Data from form is valid.
    // Check if Genre with same name already exists.
    const genreExists = await Genre.findOne({ name: req.body.name })
      .collation({ locale: "en", strength: 2 })
      .exec();
    if (genreExists) {
      // Genre exists, redirect to its detail page.
      res.redirect(genreExists.url);
    } else {
      await genre.save();
      // New genre saved. Redirect to genre detail page.
      res.redirect(genre.url);
    }
  }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }).exec(),
  ]);

  if (genre === null) {
    res.redirect("/catalog/genres");
  }

  res.render("genre_delete", {
    title: "Delete Genre",
    book_list: booksInGenre,
    genre,
  });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }).exec(),
  ]);

  if (booksInGenre.length > 0) {
    // render same as in GET
    res.render("genre_delete", {
      title: "Delete Genre",
      book_list: booksInGenre,
      genre,
    });
    return;
  }

  // if there are no books, delete genre.
  await Genre.findByIdAndDelete(req.body.genreid);
  res.redirect("/catalog/genres");
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id).exec();
  if (genre === null) {
    const err = new Error("Genre not found.");
    err.status = 404;
    return next(err);
  }
  res.render("genre_form", {
    title: "Update Genre",
    genre,
  });
});

// Handle Genre update on POST.
exports.genre_update_post = [
  body("name", "Name must not be empty.").trim().isLength({ min: 3 }).escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    // if there are no errors, update genre object for that id
    // with escaped/trimmed data
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });
    if (!errors.isEmpty()) {
      const genre = await Genre.findById(req.params.id).exec();

      res.render("genre_form", {
        title: "Update Genre",
        genre,
        errors: errors.array(),
      });
      return;
    }

    // if data submitted is valid, update genre in db
    const updatedGenre = await Genre.findByIdAndUpdate(
      req.params.id,
      genre,
      {}
    );
    res.redirect(updatedGenre.url);
  }),
];
