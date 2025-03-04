const Job = require("../models/Job");
const parseVErr = require("../utils/parseValidationErrs");

const getAllJobs = async (req, res) => {
  const jobs = await Job.find({ createdBy: req.user._id });
  res.render("jobs", { jobs });
};

const newJobForm = (req, res) => {
  res.render("job", { job: null });
};

const createJob = async (req, res, next) => {
  req.body.createdBy = req.user._id;

  try {
    await Job.create(req.body);
  } catch (e) {
    if (e.constructor.name === "ValidationError") {
      parseVErr(e, req);
    } else {
      return next(e);
    }
  }
  res.redirect("/jobs");
};

const getJob = async (req, res) => {
  // console.log(req.params.id);
  // const userId = req.user._id;
  // console.log(userId);

  const job = await Job.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });

  if (!job) {
    req.flash("error", `Id ${req.params.id} not found.`);
    res.redirect("/jobs");
  }

  res.render("job", { job });
};

const updateJob = async (req, res) => {
  const job = await Job.findByIdAndUpdate(
    { _id: req.params.id, createdBy: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!job) {
    req.flash("error", `Id ${req.params.id} not found.`);
  }

  res.redirect("/jobs");
};

const deleteJob = async (req, res) => {
  const job = await Job.findByIdAndDelete({
    _id: req.params.id,
    createdBy: req.user._id,
  });
  if (!job) {
    req.flash("error", `Id ${req.params.id} not found.`);
  }
  res.redirect("/jobs");
};

module.exports = {
  getAllJobs,
  createJob,
  newJobForm,
  getJob,
  updateJob,
  deleteJob,
};
