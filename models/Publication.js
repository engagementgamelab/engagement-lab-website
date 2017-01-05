/**
 * Engagement Lab Website
 * 
 * Publication page Model
 * @module publication
 * @author Johnny Richardson
 * 
 * For field docs: http://keystonejs.com/docs/database/
 *
 * ==========
 */

var keystone = require('keystone');
var Types = keystone.Field.Types;
var slack = keystone.get('slack');

/**
 * @module publication
 * @constructor
 * See: http://keystonejs.com/docs/database/#lists-options
 */
var Publication = new keystone.List('Publication', 
	{
		sortable: true,
		track: true,
		map: { name: 'title' },
		autokey: { path: 'key', from: 'title', unique: true }
	});

/** 
	* Caching fields for 'post' save hook
	*/
var docIsNew;
var docIsModified;

/**
 * Model Fields
 * @main Publication
 */
Publication.add({
	title: { type: String, label: 'Title', required: true, initial: true, index: true },
	author: { type: String, label: 'Author Name(s)', required: true, initial: true },

	category: { type: Types.Select, options: 'Book, Guide, Articles and Chapters', required: true, initial: true },
	
	url: { type: String, label: 'URL',
		dependsOn: { category: 'Articles and Chapters' }, initial: true },
	urls: {
		type: Types.TextArray,
		label: 'Links to purchase book',
		note: 'Must be in format "http://www.something.org"'
	},
	downloadUrls: {
		type: Types.TextArray,
		label: 'Link(s) to downlad book',
		note: 'Must be in format "http://www.something.org"'
	},
	file: {
		type: Types.AzureFile,
		label: 'File',
		filenameFormatter: function(item, filename) {
			return item.key + require('path').extname(filename);
		},
		containerFormatter: function(item, filename) {
			return 'elabpublication';
		}
	},

	// This field is required in the save hook below instead of here as keystone dependsOn workaround
	blurb: { type: Types.Textarea, label: 'Blurb Text', 
		dependsOn: { category: 'Articles and Chapters' } },

	description: { type: Types.Markdown, label: 'Description Text',
		dependsOn: { category: ['Book', 'Guide'] }, required: false, initial: true },

	image: { type: Types.CloudinaryImage, label: 'Thumbnail',
		dependsOn: { category: ['Book', 'Guide'] }, folder: 'research/publications', autoCleanup: true },

	bannerImage: { type: Types.CloudinaryImage, label: 'Banner Image',
		dependsOn: { category: ['Book', 'Guide'] }, folder: 'research/publications', autoCleanup: true },

	date: { type: Date, label: 'Publication Date', initial: true, required: true },

	createdAt: { type: Date, default: Date.now, noedit: true, hidden: true }
});

/**
 * Hooks
 * =============
 */
Publication.schema.pre('save', function(next) {
  
  // Save state for post hook
  this.wasNew = this.isNew;
  this.wasModified = this.isModified();

  next();

});

Publication.schema.post('save', function(next) {

  var publication = this;

  // Make a post to slack when this Publication is updated    
  slack.Post(
  	Publication.model, this, true, 
  	function() { return publication.title; }
  );


});

/**
 * Model Registration
 */
Publication.defaultSort = '-createdAt';
Publication.defaultColumns = 'title, category';
Publication.register();
