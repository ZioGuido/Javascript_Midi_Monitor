///////////////////////////////////////////////////////////
// Simple MIDI Monitor based on WEB MIDI API
// Experimental code by Guido Scognamiglio
// Last update: October 2018
//


// Channel Message Staus
var MIDI_STATUS_NOTEOFF				= 0x80;	// b2=note, b3=velocity
var MIDI_STATUS_NOTEON				= 0x90;	// b2=note, b3=velocity
var MIDI_STATUS_AFTERTOUCH			= 0xA0;	// b2=note, b3=pressure
var MIDI_STATUS_CONTROLCHANGE		= 0xB0;	// b2=controller, b3=value
var MIDI_STATUS_PROGRAMCHANGE		= 0xC0;	// b2=program number
var MIDI_STATUS_CHANNELPRESSURE		= 0xD0;	// b2=pressure
var MIDI_STATUS_PITCHBEND			= 0xE0;	// pitch (b3 & 0x7f) << 7 | (b2 & 0x7f) and center=0x2000
var MIDI_STATUS_SYSEX_START			= 0xF0;


var MidiNoteName = new Array(" C", "C#", " D", "D#", " E", " F", "F#", " G", "G#", " A", "A#", " B");
function getMidiNoteName(note)
{
	var col = parseInt(note / 12);	// octave number
	var row = note % 12;			// note index
	return MidiNoteName[row] + col;
}

function pad(num, size)
{
    var s = "    " + num;
    return s.substr(s.length - size).replace(/\s/, "&nbsp;");
}



function ProcessMidi(event)
{
	var html;
	//console.log( event.data );

	var status = event.data[0] & 0xF0;
	var channel = event.data[0] & 0x0F;

	channel += 1;
	channel = pad(channel, 2);

	var Byte2 = pad(event.data[1], 3);
	var Byte3 = pad(event.data[2], 3);

	var timestamp = pad(+new Date() - window.performance.timing.navigationStart, 8);

	switch (status)
	{
	case MIDI_STATUS_NOTEOFF:
		html = "<div class=note_on>"+timestamp+" Note Off&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CH:&nbsp;" + channel + "&nbsp;&nbsp;&nbsp;NOTE:&nbsp;" + Byte2 + "&nbsp;("+getMidiNoteName(event.data[1])+")&nbsp;&nbsp;VELOCITY:&nbsp;" + Byte3 + "</div>";
		break;

	case MIDI_STATUS_NOTEON:
		html = "<div class=note_off>"+timestamp+" Note On&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CH:&nbsp;" + channel + "&nbsp;&nbsp;&nbsp;NOTE:&nbsp;" + Byte2 + "&nbsp;("+getMidiNoteName(event.data[1])+")&nbsp;&nbsp;VELOCITY:&nbsp;" + Byte3 + "</div>";
		break;

	case MIDI_STATUS_CONTROLCHANGE:
		html = "<div class=controller>"+timestamp+" CONTROLLER&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CH:&nbsp;" + channel + "&nbsp;CC NUM:&nbsp;" + Byte2 + "&nbsp;&nbsp;&nbsp;VALUE:&nbsp;" + Byte3 + "</div>";
		break;

	case MIDI_STATUS_PROGRAMCHANGE:
		html = "<div class=prog>"+timestamp+" Prog Change&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CH:&nbsp;" + channel + "&nbsp;PC NUM:&nbsp;" + Byte2 + "</div>";
		break;

	case MIDI_STATUS_CHANNELPRESSURE:
		html = "<div class=pressure>"+timestamp+" Channel Aft&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CH:&nbsp;" + channel + "&nbsp;&nbsp;VALUE:&nbsp;" + Byte2 + "</div>";
		break;

	case MIDI_STATUS_PITCHBEND:
		html = "<div class=pitchbend>"+timestamp+" Pitch Bender&nbsp;&nbsp;&nbsp;&nbsp;CH:&nbsp;" + channel + "&nbsp;&nbsp;VALUE:&nbsp;" + ((event.data[1]|(event.data[2]<<7))-8192) + "</div>";
		break;

	case MIDI_STATUS_SYSEX_START:
		html = "<div class=sysex>System Exclusive: ";
		html += event.data;
		html += "</div>";
		break;

	}

	$("#MonitorBox").append(html);
	window.scrollTo(0,document.body.scrollHeight);

	// Remove older log entries after X entries
	if ($("#MonitorBox > div").length > 300)
	{
		$('#MonitorBox').find('div').first().remove();
	}
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WEB MIDI API FUNCTIONS ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var midi = null;  // global MIDIAccess object
var InputPort = null;

function SetPort(port_selection)
{
	if (midi == null) return;
	if (InputPort != null && port_selection == "")
	{
		$("#MonitorBox").html("");
		InputPort.close;
		return;
	}

	midi.inputs.forEach(function(port)
	{
		if (port.name == port_selection)
		{
			InputPort = port;
			InputPort.open;
			InputPort.onmidimessage = ProcessMidi;
		}
	});


	//Start();
}

function onMIDISuccess(midiAccess)
{
	midi = midiAccess;

	midi.inputs.forEach(function(port) {
		$("#InPort").append('<option value="'+port.name+'">'+port.name+'</option>');
	});
}

function onMIDIFailure(msg)
{
	myAlert("This browser does not support WEB MIDI API.<br>" + msg);
}

// Init MIDI
window.addEventListener("load", () => {
    if ( !navigator.requestMIDIAccess ) {
        myAlert("This browser does not support WebMIDI!<br>Please use Google Chrome.");
        return;
    }

    navigator.requestMIDIAccess({ sysex: false })
        .then(onMIDISuccess, onMIDIFailure)
        .catch(error => alert(error.message));
});
