const Grievance = require('../models/Grievance');

exports.createGrievance = async (req,res) => {
  try {
    const g = new Grievance({ user: req.user._id, subject: req.body.subject, message: req.body.message });
    await g.save();
    res.json(g);
  } catch(err){ res.status(400).json({ error: err.message }); }
};

exports.getGrievances = async (req,res) => {
  try {
    const q = {};
    // if user -> only own
    if(req.user.role === 'user') q.user = req.user._id;
    const gs = await Grievance.find(q).populate('user').limit(200);
    res.json(gs);
  } catch(err){ res.status(400).json({ error: err.message }); }
};

exports.updateGrievance = async (req,res) => {
  try {
    const g = await Grievance.findById(req.params.id);
    if(!g) return res.status(404).json({ message: 'Not found' });
    if(req.body.note) g.history.push({ note: req.body.note, by: req.user.name, at: new Date() });
    if(req.body.status) g.status = req.body.status;
    await g.save();
    res.json(g);
  } catch(err){ res.status(400).json({ error: err.message }); }
};
