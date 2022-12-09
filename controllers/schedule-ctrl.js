const OrgAccount = require('../models/org');
const Profile = require('../models/profile');
const Schedule = require('../models/schedule');
exports.getSchedule = (req, res, next) => {
  Profile.find({ orgId: req.org._id })
    .then((profiles) => {
      res.render('schedule/schedule', {
        pageTitle: 'Schedule',
        orgName: req.org.name,
        isAuthenticated: req.session.isLoggedIn,
        profiles: profiles,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getProfile = (req, res, next) => {
  let editing = false;
  if (editing) {
    res.render('schedule/profile', {
      editing: false,
      profile: null,
      isAuthenticated: req.session.isLoggedIn,
    });
  } else {
    res.render('schedule/profile', {
      editing: false,
      profile: null,
      isAuthenticated: req.session.isLoggedIn,
    });
  }
};
exports.postProfile = (req, res, next) => {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const phone = req.body.phone;
  const position = req.body.position;
  const available = {
    sun: req.body.Sunday,
    mon: req.body.Monday,
    tue: req.body.Tuesday,
    wed: req.body.Wednesday,
    thu: req.body.Thursday,
    fri: req.body.Friday,
    sat: req.body.Saturday,
  };
  const orgId = req.org._id;

  for (var key of Object.keys(available)) {
    if (available[key] === undefined) {
      available[key] = false;
    }
  }
  const newProfile = new Profile({
    fname: fname,
    lname: lname,
    phone: phone,
    availability: {
      days: {
        sun: available.sun,
        mon: available.mon,
        tue: available.tue,
        wed: available.wed,
        thu: available.thu,
        fri: available.fri,
        sat: available.sat,
      },
    },
    position: position,
    orgId: orgId,
  });

  newProfile.save();
  const newSchedule = new Schedule({
    schedule: { appointments: [] },
    profileId: newProfile._id,
  });

  newSchedule.save();

  res.redirect('/schedule');
};
exports.postAppointment = (req, res, next) => {
  const day = req.body.day;
  const time = req.body.start;
  const dateTime = new Date();
  dateTime.setFullYear(day.split('-')[0]);
  dateTime.setMonth(day.split('-')[1] - 1);
  dateTime.setDate(day.split('-')[2]);
  dateTime.setHours(time.split(':')[0]);
  dateTime.setMinutes(time.split(':')[1]);
  const appointment = {
    dayTime: dateTime,
    duration: req.body.duration,
    name: req.body.name,
    reason: req.body.reason,
    phone: req.body.phone,
  };
  Schedule.findOne({ profileId: req.body.profile })
    .then((schedule) => {
      if (!schedule) {
        console.log('No matching schedule found');
        return;
      }
      return schedule.addAppointment(appointment);
    })
    .catch((err) => {
      console.log(err);
    });

  res.redirect('/schedule');
};
exports.getScheduleData = (req, res, next) => {
  const profileId = req.params.profileId;
  const newDate = new Date(req.params.date);
  const dateString = newDate.toLocaleDateString();
  Schedule.findOne({ profileId: profileId })
    .then((sch) => {
      if (!sch) {
        console.log('No schedule found');
        return;
      }
      const filteredApnt = sch.schedule.appointments.filter(
        (apt) => apt.dayTime.toLocaleDateString() === dateString
      );

      res
        .status(200)
        .json({ appointments: filteredApnt, profileId: sch.profileId });
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.getEditProfile = (req, res, next) => {
  const editing = req.query.edit;
  if (!editing) {
    console.log('editing = false');
    return res.redirect('/schedule');
  }
  const profileId = req.params.profileId;
  Profile.findById(profileId)
    .then((profile) => {
      if (!profile) {
        console.log('No profile found');
        return res.redirect('/schedule');
      }
      res.render('schedule/profile', {
        editing: editing,
        profile: profile,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => console.log(err));
};
exports.deleteAppointment = (req, res, next) => {
  const profileId = req.params.profileId;
  const schId = req.params.schId;
  Schedule.findOne({ profileId: profileId })
    .then((schedule) => {
      if (!schedule) {
        console.log('no schedule found.');
        return res.redirect('/schedule');
      }
      return schedule.removeAppointment(schId);
    })
    .then((result) => {
      res.redirect('/schedule');
    })
    .catch((err) => {
      console.log(err);
      res.redirect('/schedule');
    });
};
