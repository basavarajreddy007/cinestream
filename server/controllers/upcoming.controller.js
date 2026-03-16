import Upcoming from '../models/Upcoming.model.js';

export const getUpcoming = async (req, res) => {
  try {
    const items = await Upcoming.find({ releaseDate: { $gte: new Date() } })
      .sort('releaseDate').limit(20).populate('uploadedBy', 'name');
    res.json({ success: true, upcoming: items });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch upcoming' });
  }
};

export const createUpcoming = async (req, res) => {
  try {
    const { title, description, genre, type, releaseDate, director, cast, language, trailerUrl } = req.body;
    const thumbnail = req.file?.path;
    if (!thumbnail) return res.status(400).json({ success: false, message: 'Thumbnail required' });

    const item = await Upcoming.create({
      title, description,
      genre: genre ? JSON.parse(genre) : [],
      type, releaseDate, director,
      cast: cast ? JSON.parse(cast) : [],
      language, trailerUrl, thumbnail,
      uploadedBy: req.user._id,
    });
    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create upcoming' });
  }
};

export const toggleInterested = async (req, res) => {
  try {
    const item = await Upcoming.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });

    const userId = req.user._id;
    const isIn = item.interestedUsers.includes(userId);
    if (isIn) {
      item.interestedUsers.pull(userId);
      item.interestedCount = Math.max(0, item.interestedCount - 1);
    } else {
      item.interestedUsers.push(userId);
      item.interestedCount += 1;
    }
    await item.save();
    res.json({ success: true, interested: !isIn, count: item.interestedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
};

export const deleteUpcoming = async (req, res) => {
  try {
    await Upcoming.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
};
