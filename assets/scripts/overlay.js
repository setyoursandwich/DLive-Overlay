let DLOverlay = function(){
			
	let self = this;
	
	let author;
	let voice;
	let switcheroo = 2;
	
	let isPlaying = false;
	
	let votesHistory = []
	let messageHistory = [];
	
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
		
		setInterval(function(){
			switch( switcheroo ){
				case 1: 
					getContent( function(response){
						
						let voteList = response.result.votes;
						let newVotes = voteList.slice(votesHistory.length, voteList.length);
						
						let recursiveSpeakAndShow = function(i){
							
							let voter = newVotes[i]['voter'];
							
							let percent = newVotes[i]['percent'];
							percent = percent / 100;
							
							let message = 'voted for '+percent+ ' percent';
							
							
							speakAndShow(voter, message + '<br><img src="assets/images/vote.gif">', voter + " " +message, function(){ }, function(){ 
								
								if( i < newVotes.length ){
									let index = i+1;
									recursiveSpeakAndShow( index );
								}
							});
							
						}
						
						if( newVotes.length > 0 ){
							recursiveSpeakAndShow( 0 );
						}
						
						votesHistory = voteList;
					});
					switcheroo = 2; break;
				case 2: 
					getContentReplies( function(response){
						console.log( response );
						
						let replyList = response.result.discussions;
						let newReplies = replyList.slice(messageHistory.length, replyList.length);
						
						let commenter = 
						let message = 
						
						let recursiveSpeakAndShow = function(i){
							//let commenter = newReplies['i']
						}
						
						messageHistory = replyLists;
					});
					//switcheroo = 1; break;
			}
			
			
		}, 2500)
		
	}
	
	let getContent = function( callback ){
		apiCall('tags_api.get_active_votes', {
			"author":"foreveraverage", 
			"permlink":"250a7c76-6d74-11e8-a955-0242ac110003"
			}, callback);
	}
	
	let getContentReplies = function( callback ){
		apiCall('tags_api.get_content_replies',  {
			"author":"foreveraverage", 
			"permlink":"250a7c76-6d74-11e8-a955-0242ac110003"
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
			console.log( self.voice );
			responsiveVoice.speak(spokenText, self.voice, {onstart: fadeInCallBack, onend: function(){
				$("#msgWrapper").fadeToggle( "slow" ).delay( 1000 ).queue( fadeOutCallBack() );
			}});
		})
	}
	
	return{
		initialize:			initialize,
		getContent:			getContent,
		getContentReplies:	getContentReplies,
		speakAndShow: 		speakAndShow,
		start:				start
	}
}