const express = require("express");
const router = express.Router();
const {
  getAllJobs,
  createJob,
  newJobForm,
  getJob,
  updateJob,
  deleteJob,
} = require("../controllers/jobs");

router.route("/").get(getAllJobs);
router.route("/new").get(newJobForm).post(createJob);
router.route("/edit/:id").get(getJob).post(updateJob);
router.route("/delete/:id").post(deleteJob);

module.exports = router;
