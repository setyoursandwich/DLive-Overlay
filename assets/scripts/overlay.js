"use strict";

let DLOverlay = function(author, voice){
			
	let self = this;
	
	self.author = author;
	self.voice = voice;

	self.switcheroo = 1;
	
	self.votesHistory = []
	self.messageHistory = [];
	
	//private methods
	function apiCall(method, params, callback){
		let request = {
			method : 	method,
			params: 	params,
			id: 1,
			jsonrpc: "2.0"
		}
		
		$.ajax({
			url: "https://api.steemit.com",
			type: "POST",
			data: JSON.stringify(request),
			datatype: "json",
			headers: {
				"Content-Type": "application/json"
			},
			success: function(response){
				if( response !== undefined ){
					callback( response );
				}
			}
		})
	}
	
	//public methods
	let initialize = function(author, voice){
		self.author = author;
		self.voice = voice;
	}
	
	let start = function() {
		let playing = false;
		let loopChecking = setInterval(function(){
			if( !playing ){
				switch( self.switcheroo ){
				case 1: 
					getContent( function(response){
						
						let voteList = response.result.votes;
						let newVotes = voteList.slice(self.votesHistory.length, voteList.length);
						
						let recursiveSpeakAndShow = function(i){
							
							let voter = newVotes[i]['voter'];
							
							let percent = newVotes[i]['percent'];
							percent = percent / 100;
							
							let message = 'voted for '+percent+ ' percent';
							
							
							speakAndShow(voter, message + '<br><img src="assets/images/vote.gif">', voter + " " +message, function(){ }, function(){ 
								let sound = new Audio('assets/audio/vote.mp3');
								sound.play();
								
								if( i < newVotes.length-1 ){
									let index = i+1;
									recursiveSpeakAndShow( index );
								}else{
									playing = false;
								}
							});
							
						}
						
						if( newVotes.length > 0 ){
							playing = true;
							recursiveSpeakAndShow( 0 );
						}
						self.votesHistory = voteList;
					});
					self.switcheroo = 2;
					break;
				case 2: 
					getContentReplies( function(response){
						
						let replyList = response.result.discussions;
						let newReplies = replyList.slice(self.messageHistory.length, replyList.length);
						
						let recursiveSpeakAndShow = function(i){
							let commenter = newReplies[i].author;
							let message = newReplies[i].body;
							
							
							for( let i = 0; i < self.votesHistory.length; i++ ){
								if(commenter === self.votesHistory[i]['voter'] ){
									
									speakAndShow(commenter, message, message, function(){}, function(){
										if( i < newReplies.length ){
											let index = i+1;
											recursiveSpeakAndShow(index);
										}else{
											playing = false;
										}
									});
									
									break;
								}
								
							}
							
						}
						
						if( newReplies.length > 0 ){
							playing = true;
							recursiveSpeakAndShow(0);
						}
						
						self.messageHistory = replyList;
					});
					
					self.switcheroo = 1;
					break;
				}
			}
		}, 2500)
		
	}
	
	let getContent = function( callback ){
		apiCall('tags_api.get_active_votes', {
			"author":"foreveraverage", 
			"permlink":"suggestion-don-t-know-how-to-use-that-leftover-5-dollar-on-steam-may-i-suggest-overlord"
			}, callback);
	}
	
	let getContentReplies = function( callback ){
		apiCall('tags_api.get_content_replies',  {
			"author":"foreveraverage", 
			"permlink":"suggestion-don-t-know-how-to-use-that-leftover-5-dollar-on-steam-may-i-suggest-overlord"
		}, callback)
	}
	
	let speakAndShow = function( author, writtenText, spokenText, fadeInCallBack, fadeOutCallBack ){
		//select authorBox and append author
		let authorBox = document.querySelector(".author");
		authorBox.innerHTML = author;
		//select messagebox and append text
		let messageBox = document.querySelector(".message");
		messageBox.innerHTML = writtenText;
		
		$("#msgWrapper").fadeToggle( "slow", function(){
			//play the message when fully visible
			responsiveVoice.speak(spokenText, self.voice, {onstart: fadeInCallBack, onend: function(){
				$("#msgWrapper").fadeToggle( "slow" ).delay( 1000 ).queue( fadeOutCallBack() );
			}});
		})
	}
	
	return{
		getContent:			getContent,
		getContentReplies:	getContentReplies,
		speakAndShow: 		speakAndShow,
		start:				start
	}
}