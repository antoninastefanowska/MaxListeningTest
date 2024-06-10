inlets = 1;
outlets = 2;

var SCORE_SCALE = 5;
var SOUNDS = ["hog.wav", "knocking.wav", "cave.wav", "glass.wav"];
var CHANNELS = jsarguments[1];
var PARTICIPANT_INFO_FILENAME = "participants.csv";
var LISTENING_TEST_DATA_FILENAME = "data.csv";
var DEFAULT_CHANNEL = 0;

var context = this;
var current_participant_id = null;

function random_index(max) {
	return Math.floor(Math.random() * max);
}

function format_digits(value) {
	return (value < 10 ? "0" : "") + value;
}

function format_date(date) {
	var day = format_digits(date.getDate());
	var month = format_digits(date.getMonth() + 1);
	var year = date.getFullYear();
	var hour = format_digits(date.getHours());
	var minutes = format_digits(date.getMinutes())
	var seconds = format_digits(date.getSeconds());
	return hour + ":" + minutes + ":" + seconds + " " + day + "-" + month + "-" + year;
}

// =====================================================

var SceneType = {
	WELCOME: 0,
	PERSONAL_INFO: 1,
	INSTRUCTION: 2,
	PREVIEW: 3,
	PRETEST: 4,
	LISTENING_TEST: 5,
	GOODBYE: 6
}

var Gender = {
	MALE: "male",
	FEMALE: "female",
	NOT_SPECIFIED: "not specified"
}

var AgeLabel = {
	UNDER_18: "Poniżej 18",
	_18_25: "18-25",
	_26_35: "26-35",
	_36_50: "36-50",
	OVER_50: "Powyżej 50"
}

var Age = {
	UNDER_18: "<18",
	_18_25: "18-25",
	_26_35: "26-35",
	_36_50: "36-50",
	OVER_50: ">50"
}

// =====================================================

function BaseScene() {
	this.controls = [];
}

BaseScene.prototype.start = function() {
	this.show_controls();
	this.disable_next_button();
}

BaseScene.prototype.ready = function() { 
	this.enable_input();
}

BaseScene.prototype.finished = function() {
	this.enable_next_button();
}

BaseScene.prototype.cleanup = function() { 
	this.hide_controls();
}

BaseScene.prototype.has_next_scene = function() { }

BaseScene.prototype.get_next_scene = function() { }

BaseScene.prototype.save_data = function() { }

BaseScene.prototype.get_type = function() { }

BaseScene.prototype.hide_controls = function() {
	for (var i in this.controls)
		this.controls[i].message("hidden", true);
}

BaseScene.prototype.show_controls = function() {
	for (var i in this.controls)
		this.controls[i].message("hidden", false);
}

BaseScene.prototype.enable_input = function() { }

BaseScene.prototype.disable_input = function() { }

BaseScene.prototype.enable_next_button = function() {
	var btn_next = context.patcher.getnamed("btn_next");
	btn_next.message("active", true);
}

BaseScene.prototype.disable_next_button = function() {
	var btn_next = context.patcher.getnamed("btn_next");
	btn_next.message("active", false);
}

// =====================================================

function WelcomeScene() {
	BaseScene.call(this);

	this.controls.push(context.patcher.getnamed("label_welcome"));
}

WelcomeScene.prototype = Object.create(BaseScene.prototype);

WelcomeScene.prototype.start = function() {
	this.show_controls();
	this.enable_next_button();
}

WelcomeScene.prototype.has_next_scene = function() {
	return true;
}

WelcomeScene.prototype.get_next_scene = function() {
	return new PersonalInfoScene();
}

WelcomeScene.prototype.get_type = function() {
	return SceneType.WELCOME;
}

// =====================================================

function PersonalInfoScene() {
	BaseScene.call(this);

	this.gender = null;
	this.age = null;
	this.hearing_problems = null;
	this.agreement = null;

	var combobox_age = context.patcher.getnamed("combobox_age");
	combobox_age.message("clear");

	combobox_age.message("append", "Wybierz");
	for (var key in AgeLabel)
		combobox_age.message("append", AgeLabel[key]);

	this.controls.push(combobox_age);
	this.controls.push(context.patcher.getnamed("radiobtn_gender"));
	this.controls.push(context.patcher.getnamed("radiobtn_hearing"));
	this.controls.push(context.patcher.getnamed("radiobtn_agreement"));
	this.controls.push(context.patcher.getnamed("label_personalinfo1"));
	this.controls.push(context.patcher.getnamed("label_personalinfo2"));
	this.controls.push(context.patcher.getnamed("label_personalinfo3"));
	this.controls.push(context.patcher.getnamed("label_personalinfo4"));
	this.controls.push(context.patcher.getnamed("label_personalinfo5"));
	this.controls.push(context.patcher.getnamed("label_personalinfo6"));
	this.controls.push(context.patcher.getnamed("label_personalinfo7"));
	this.controls.push(context.patcher.getnamed("label_personalinfo8"));
	this.controls.push(context.patcher.getnamed("label_personalinfo9"));
	this.controls.push(context.patcher.getnamed("label_personalinfo10"));
	this.controls.push(context.patcher.getnamed("label_personalinfo11"));
	this.controls.push(context.patcher.getnamed("label_personalinfo12"));
}

PersonalInfoScene.prototype = Object.create(BaseScene.prototype);

PersonalInfoScene.prototype.start = function() {
	BaseScene.prototype.start.call(this);
	this.reset_input();
}

PersonalInfoScene.prototype.has_next_scene = function() {
	return true;
}

PersonalInfoScene.prototype.get_next_scene = function() {
	if (this.age != Age.UNDER_18)
		return new InstructionScene();
	else
		return new GoodbyeScene();
}

PersonalInfoScene.prototype.get_type = function() {
	return SceneType.PERSONAL_INFO;
}

PersonalInfoScene.prototype.cleanup = function() {
	BaseScene.prototype.cleanup.call(this);
	this.reset_input();
	if (this.age != Age.UNDER_18)
		this.save_data();
}

PersonalInfoScene.prototype.save_data = function() {
	BaseScene.prototype.save_data.call(this);

	var file = null;
	if (current_participant_id == null) {
		file = new File(PARTICIPANT_INFO_FILENAME, "readwrite");
		var line = null;

		file.open();
		if (file.position < file.eof)
			file.readline();

		while (file.position < file.eof)
			line = file.readline();
		
		if (line != null) {
			var words = line.split(",");
			current_participant_id = parseInt(words[0]) + 1;
		} else
			current_participant_id = 0;
	} else {
		file = new File(PARTICIPANT_INFO_FILENAME, "write");
		file.position = file.eof;
	}
	
	var entry = {
		id: current_participant_id,
		gender: this.gender,
		age: this.age,
		hearing_problems: this.hearing_problems,
		agreement: this.agreement,
		timestamp: format_date(new Date())
	};

	var keys = Object.keys(entry);
	if (file.eof == 0) {
		var header = keys.join(",");
		file.writeline(header);
	}
	var new_line = keys.map(function(key) { return entry[key] }).join(",");
	file.writeline(new_line);
	file.close();
}

PersonalInfoScene.prototype.set_gender = function(value) {
	switch (value) {
		case 0:
			this.gender = Gender.MALE;
			break;
		case 1:
			this.gender = Gender.FEMALE;
			break;
		case 2:
			this.gender = Gender.NOT_SPECIFIED;
			break;
	}
}

PersonalInfoScene.prototype.set_age = function(value) {
	switch (value) {
		case 0:
			this.age = null;
			break;
		case 1:
			this.age = Age.UNDER_18;
			break;
		case 2:
			this.age = Age._18_25;
			break;
		case 3:
			this.age = Age._26_35;
			break;
		case 4:
			this.age = Age._36_50;
			break;
		case 5:
			this.age = Age.OVER_50;
			break;
	}
}

PersonalInfoScene.prototype.set_hearing_problems = function(value) {
	this.hearing_problems = value;
}

PersonalInfoScene.prototype.set_agreement = function(value) {
	this.agreement = value;
}

PersonalInfoScene.prototype.data_collected = function() {
	return this.gender != null && this.age != null && this.hearing_problems != null && this.agreement == 1;
}

PersonalInfoScene.prototype.reset_input = function() {
	var radiobtn_gender = context.patcher.getnamed("radiobtn_gender");
	var combobox_age = context.patcher.getnamed("combobox_age");
	var radiobtn_hearing = context.patcher.getnamed("radiobtn_hearing");
	var radiobtn_agreement = context.patcher.getnamed("radiobtn_agreement");

	for (var i = 0; i < 3; i++)
		radiobtn_gender.message("set", 0, i, 0);
	for (var i = 0; i < 2; i++)
		radiobtn_hearing.message("set", 0, i, 0);
	for (var i = 0; i < 2; i++)
		radiobtn_agreement.message("set", 0, i, 0);
	
	combobox_age.message("set", 0);
}

// =====================================================

function InstructionScene() {
	BaseScene.call(this);
	this.controls.push(context.patcher.getnamed("label_instruction"));
}

InstructionScene.prototype = Object.create(BaseScene.prototype);

InstructionScene.prototype.start = function() {
	this.show_controls();
	this.enable_next_button();
}

InstructionScene.prototype.has_next_scene = function() {
	return true;
}

InstructionScene.prototype.get_next_scene = function() {
	return new PreviewScene();
}

InstructionScene.prototype.get_type = function() {
	return SceneType.INSTRUCTION;
}

// =====================================================

function PreviewScene() {
	BaseScene.call(this);
	this.current_track_index = -1;
	this.controls.push(context.patcher.getnamed("label_training"));

	this.controls.push(context.patcher.getnamed("radiobtn_score"));
	this.controls.push(context.patcher.getnamed("label_question"));
	this.controls.push(context.patcher.getnamed("label_progress"));
	this.controls.push(context.patcher.getnamed("label_disagree"));
	this.controls.push(context.patcher.getnamed("label_agree"));
}

PreviewScene.prototype = Object.create(BaseScene.prototype);

PreviewScene.prototype.start = function() {
	BaseScene.prototype.start.call(this);

	this.current_track_index++;
	var sound_label = context.patcher.getnamed("label_progress");
	sound_label.message("set", this.current_track_index + 1 + "/" + this.get_track_count());

	this.disable_input();
	this.play_track();
}

PreviewScene.prototype.has_next_scene = function() {
	return true;
}

PreviewScene.prototype.get_next_scene = function() {
	if (this.current_track_index + 1 < SOUNDS.length)
		return this;
	else
		return new PretestScene();
}

PreviewScene.prototype.get_type = function() {
	return SceneType.PREVIEW;
}

PreviewScene.prototype.play_track = function() {
	var sound = SOUNDS[this.current_track_index];
	var channel = random_index(CHANNELS);
	outlet(0, "open", sound);
	outlet(0, "int", 1);
	outlet(1, "int", channel + 1);
}

PreviewScene.prototype.get_track_count = function() {
	return SOUNDS.length;
}

PreviewScene.prototype.enable_input = function() {
	var radiobtn_score = context.patcher.getnamed("radiobtn_score");
	for (var i = 0; i < SCORE_SCALE; i++)
		radiobtn_score.message("enablecell", 0, i);
}

PreviewScene.prototype.disable_input = function() {
	var radiobtn_score = context.patcher.getnamed("radiobtn_score");
	for (var i = 0; i < SCORE_SCALE; i++) {
		radiobtn_score.message("set", 0, i, 0);
		radiobtn_score.message("disable", 0, i);
	}
}

// =====================================================

function PretestScene() {
	BaseScene.call(this);

	this.controls.push(context.patcher.getnamed("label_pretest"));
}

PretestScene.prototype = Object.create(BaseScene.prototype);

PretestScene.prototype.start = function() {
	this.show_controls();
	this.enable_next_button();
}

PretestScene.prototype.has_next_scene = function() {
	return true;
}

PretestScene.prototype.get_next_scene = function() {
	return new ListeningTestScene();
}

PretestScene.prototype.get_type = function() {
	return SceneType.PRETEST;
}

// =====================================================

function ListeningTestScene() {
	PreviewScene.call(this);
	this.current_score = -1;
	this.playlist = this.generate_playlist();

	this.controls.shift();
}

ListeningTestScene.prototype = Object.create(PreviewScene.prototype);

ListeningTestScene.prototype.cleanup = function() {
	this.disable_next_button();

	if (this.current_track_index >= 0)
		this.save_data();

	if (this.finished_playlist())
		this.hide_controls();
}

ListeningTestScene.prototype.save_data = function() {
	BaseScene.prototype.save_data.call(this);
	
	if (current_participant_id == null)
		current_participant_id = -1;

	var entry = {
		participant_id: current_participant_id, 
		sound: this.playlist[this.current_track_index].sound, 
		channel: this.playlist[this.current_track_index].channel + 1, 
		score: this.current_score 
	};

	var file = new File(LISTENING_TEST_DATA_FILENAME, "write");
	var keys = Object.keys(entry);
	file.open();

	file.position = file.eof;
	if (file.eof == 0) {
		var header = keys.join(",");
		file.writeline(header);
	}
	var new_line = keys.map(function(key) { return entry[key] }).join(",");
	file.writeline(new_line);
	file.close();
}

ListeningTestScene.prototype.get_next_scene = function() {
	if (!this.finished_playlist())
		return this;
	else
		return new GoodbyeScene();
}

ListeningTestScene.prototype.get_type = function() {
	return SceneType.LISTENING_TEST;
}

ListeningTestScene.prototype.set_score = function(value) {
	this.current_score = value;
}

ListeningTestScene.prototype.play_track = function() {
	var sound = this.playlist[this.current_track_index].sound;
	var channel = this.playlist[this.current_track_index].channel;
	
	outlet(0, "open", sound);
	outlet(0, "int", 1);
	outlet(1, "int", channel + 1);
}

ListeningTestScene.prototype.finished_playlist = function() {
	return this.current_track_index > 0 && this.current_track_index + 1 >= this.playlist.length;
}

ListeningTestScene.prototype.get_track_count = function() {
	return this.playlist.length;
}

ListeningTestScene.prototype.generate_playlist = function() {
	var taken_indices = [];
	var track_count = 2 * SOUNDS.length * CHANNELS;
	var playlist = Array(track_count);
	
	for (var i = 0; i < SOUNDS.length; i++) {
		for (var j = 0; j < CHANNELS; j++) {
			var ind1, ind2;
			do {
				ind1 = random_index(track_count);
			} while (taken_indices.indexOf(ind1) > -1);
			taken_indices.push(ind1);
			
			do {
				ind2 = random_index(track_count);
			} while (taken_indices.indexOf(ind2) > -1 || Math.abs(ind1-ind2) < 2);
			taken_indices.push(ind2);
			
			playlist[ind1] = playlist[ind2] = {
				sound: SOUNDS[i], 
				channel: j
			};
		}
	}
	return playlist;
}

// =====================================================

function GoodbyeScene() {
	BaseScene.call(this);
	this.controls.push(context.patcher.getnamed("label_goodbye"));
}

GoodbyeScene.prototype = Object.create(BaseScene.prototype);

GoodbyeScene.prototype.start = function() {
	BaseScene.prototype.start.call(this);

	var btn_next = context.patcher.getnamed("btn_next");
	btn_next.message("hidden", true);
}

GoodbyeScene.prototype.cleanup = function() {
	BaseScene.prototype.cleanup.call(this);

	var btn_next = context.patcher.getnamed("btn_next");
	btn_next.message("hidden", false);
}

GoodbyeScene.prototype.has_next_scene = function() {
	return false;
}

GoodbyeScene.prototype.get_next_scene = function() {
	return null;
}

GoodbyeScene.prototype.get_type = function() {
	return SceneType.GOODBYE;
}

// =====================================================

var current_scene = new WelcomeScene();
reset_all();
current_scene.start();

var btn_wake_up = context.patcher.getnamed("btn_wake_up");
btn_wake_up.message("bang");

function reset_all() {
	this.patcher.getnamed("btn_next").message("hidden", false);

	this.patcher.getnamed("radiobtn_score").message("hidden", true);
	this.patcher.getnamed("label_training").message("hidden", true);
	this.patcher.getnamed("label_question").message("hidden", true);
	this.patcher.getnamed("label_disagree").message("hidden", true);
	this.patcher.getnamed("label_agree").message("hidden", true);

	this.patcher.getnamed("label_welcome").message("hidden", true);

	this.patcher.getnamed("radiobtn_gender").message("hidden", true);
	this.patcher.getnamed("combobox_age").message("hidden", true);
	this.patcher.getnamed("radiobtn_hearing").message("hidden", true);
	this.patcher.getnamed("radiobtn_agreement").message("hidden", true);
	this.patcher.getnamed("label_personalinfo1").message("hidden", true);
	this.patcher.getnamed("label_personalinfo2").message("hidden", true);
	this.patcher.getnamed("label_personalinfo3").message("hidden", true);
	this.patcher.getnamed("label_personalinfo4").message("hidden", true);
	this.patcher.getnamed("label_personalinfo5").message("hidden", true);
	this.patcher.getnamed("label_personalinfo6").message("hidden", true);
	this.patcher.getnamed("label_personalinfo7").message("hidden", true);
	this.patcher.getnamed("label_personalinfo8").message("hidden", true);
	this.patcher.getnamed("label_personalinfo9").message("hidden", true);
	this.patcher.getnamed("label_personalinfo10").message("hidden", true);
	this.patcher.getnamed("label_personalinfo11").message("hidden", true);
	this.patcher.getnamed("label_personalinfo12").message("hidden", true);

	this.patcher.getnamed("label_pretest").message("hidden", true);
	this.patcher.getnamed("label_progress").message("hidden", true);
	this.patcher.getnamed("label_instruction").message("hidden", true);
	this.patcher.getnamed("label_goodbye").message("hidden", true);
}

function go_to_scene(scene) {
	current_scene.cleanup();
	current_scene.hide_controls();
	switch (scene) {
		case SceneType.WELCOME:
			current_scene = new WelcomeScene();
			break;
		case SceneType.PERSONAL_INFO:
			current_scene = new PersonalInfoScene();
			break;
		case SceneType.INSTRUCTION:
			current_scene = new InstructionScene();
			break;
		case SceneType.PREVIEW:
			current_scene = new PreviewScene();
			break;
		case SceneType.PRETEST:
			current_scene = new PretestScene();
			break;
		case SceneType.LISTENING_TEST:
			current_scene = new ListeningTestScene();
			break;
		case SceneType.GOODBYE:
			current_scene = new GoodbyeScene();
			break;
	}
	current_scene.start();
}

function on_next_button_pressed() {
	current_scene.cleanup();
	if (current_scene.has_next_scene()) {
		current_scene = current_scene.get_next_scene();
		current_scene.start();
	}
}

function on_track_finished() {
	if (current_scene.get_type() === SceneType.LISTENING_TEST || current_scene.get_type() === SceneType.PREVIEW)
		current_scene.ready();
}

function radiobutton_fix_state(name, value, state) {
	var radiobtn = this.patcher.getnamed(name);
	var row_count = radiobtn.getattr("rows");
	if (state) {
		for (var i = 0; i < row_count; i++) {
			if (i != value)
				radiobtn.message("set", 0, i, 0);
		}
	}
	radiobtn.message("set", 0, value, 1);
}

function on_score_state_changed(value, state) {
	if (current_scene.get_type() === SceneType.LISTENING_TEST || current_scene.get_type() === SceneType.PREVIEW) {
		if (state) {
			if (current_scene.get_type() === SceneType.LISTENING_TEST)
				current_scene.set_score(SCORE_SCALE - value);
			current_scene.finished();
		}
		radiobutton_fix_state("radiobtn_score", value, state);
	} 
}

function on_gender_state_changed(value, state) {
	if (current_scene.get_type() == SceneType.PERSONAL_INFO) {
		if (state) {
			current_scene.set_gender(value);
			if (current_scene.data_collected())
				current_scene.finished();
		}
		radiobutton_fix_state("radiobtn_gender", value, state);
	}
}

function on_age_changed(index) {
	if (current_scene.get_type() == SceneType.PERSONAL_INFO) {
		current_scene.set_age(index);
		if (index > 0) {
			if (current_scene.data_collected())
				current_scene.finished();
		} else
			current_scene.disable_next_button();
	}
}

function on_hearing_state_changed(value, state) {
	if (current_scene.get_type() == SceneType.PERSONAL_INFO) {
		if (state) {
			current_scene.set_hearing_problems(value);
			if (current_scene.data_collected())
				current_scene.finished();
		}
		radiobutton_fix_state("radiobtn_hearing", value, state);
	}
}

function on_agreement_state_changed(value, state) {
	if (current_scene.get_type() == SceneType.PERSONAL_INFO) {
		current_scene.set_agreement(value);
		if (value > 0) {
			if (current_scene.data_collected())
				current_scene.finished();
		} else
			current_scene.disable_next_button();
		radiobutton_fix_state("radiobtn_agreement", value, state);
	}
}