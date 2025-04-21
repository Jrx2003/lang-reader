const Project = require('../models/Project');
const mongoose = require('mongoose');

// Get all projects
exports.getAllProjects = async (req, res) => {
  console.log('API Request: GET /api/projects');
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    console.log(`Found ${projects.length} projects`);
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error getting projects:', error);
    res.status(500).json({ message: 'Failed to retrieve projects' });
  }
};

// Get a single project by ID
exports.getProjectById = async (req, res) => {
  const { id } = req.params;
  console.log(`API Request: GET /api/projects/${id}`);
  
  try {
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid project ID: ${id}`);
      return res.status(400).json({ message: 'Invalid project ID' });
    }
    
    const project = await Project.findById(id);
    
    if (!project) {
      console.log(`Project not found with ID: ${id}`);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    console.log(`Found project: ${project.name}`);
    res.status(200).json(project);
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ message: 'Failed to retrieve project' });
  }
};

// Create a new project
exports.createProject = async (req, res) => {
  console.log('API Request: POST /api/projects');
  console.log('Request body:', req.body);
  
  try {
    const { name, description, videoUrl, breakpoints, notesText } = req.body;
    
    // Ensure required fields are present
    if (!name) {
      console.log('Missing required field: name');
      return res.status(400).json({ message: 'Project name is required' });
    }
    
    // Create new project
    const project = new Project({
      name,
      description: description || '',
      videoUrl: videoUrl || '',
      breakpoints: breakpoints || [],
      notesText: notesText || '',
      createdAt: new Date()
    });
    
    const savedProject = await project.save();
    console.log(`Created new project: ${savedProject.name} (ID: ${savedProject._id})`);
    res.status(201).json(savedProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Failed to create project' });
  }
};

// Update a project
exports.updateProject = async (req, res) => {
  const { id } = req.params;
  console.log(`API Request: PUT /api/projects/${id}`);
  console.log('Request body:', req.body);
  
  try {
    const { name, description, videoUrl, breakpoints, notesText } = req.body;
    
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid project ID: ${id}`);
      return res.status(400).json({ message: 'Invalid project ID' });
    }
    
    // Find the project
    const project = await Project.findById(id);
    
    if (!project) {
      console.log(`Project not found with ID: ${id}`);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Update fields if provided in request
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (videoUrl !== undefined) project.videoUrl = videoUrl;
    if (breakpoints !== undefined) project.breakpoints = breakpoints;
    if (notesText !== undefined) project.notesText = notesText;
    
    const updatedProject = await project.save();
    console.log(`Updated project: ${updatedProject.name} (ID: ${updatedProject._id})`);
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Failed to update project' });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  console.log(`API Request: DELETE /api/projects/${id}`);
  
  try {
    // Validate ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid project ID: ${id}`);
      return res.status(400).json({ message: 'Invalid project ID' });
    }
    
    const project = await Project.findById(id);
    
    if (!project) {
      console.log(`Project not found with ID: ${id}`);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    await Project.findByIdAndDelete(id);
    console.log(`Deleted project with ID: ${id}`);
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Failed to delete project' });
  }
}; 