document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Listen for sending an email
  document.querySelector('#compose-form').onsubmit = () => {
    // fetch the url that sends the data
    fetch('emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(load_mailbox('sent'));
    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Load all emails present in the associated mailbox
  // get the root div element where the emails will be appended to
  view = document.querySelector('#emails-view');

  // make a get web request with fetch
  fetch('emails/'+ mailbox)

  // after receiving the response translate it via json()
  .then(response => response.json())
  .then(emails => {

    // loop though each email and render it on the page
    emails.forEach(email => {
      const div = document.createElement('div');
      div.className = 'container row border border-5 rounded m-1 p-1';
      div.innerHTML = `
        <span class="col-3">${email.sender}</span>
        <span class="col-6"><b>${email.subject}</b></span>
        <span class="col-3">${email.timestamp}</span>
        `;

      // only for the inbox
      if (mailbox === 'inbox'){ 
        // check if email has been read and set background of div accordingly
        if (email.read){
          div.style.background = 'white';
        } else {
          div.style.background = 'lightgray';
          console.log(email.read)
        }
      } else {
        div.style.background = 'white';
      }

      // add event listener for selecting an email
      div.addEventListener('click', () => load_email(email.id));

      // append it to the view 
      view.appendChild(div);

    });
  });
}

function load_email(email_id){
  // show the email view only
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // get the root div where the content will be added
  view = document.querySelector('#email-view')

  // clean the root div from the previous rendered email
  view.innerHTML = ""

  // fetch the email by using the email id
  fetch('emails/' + email_id)
  .then(response => response.json())
  .then(email => {
    const div = document.createElement('div');
    div.className = "container";
    div.innerHTML = `
      <div>From: <b>${email.sender}</b></div>
      <div>To: <b>${email.recipients}</b></div>
      <div>Subject: <b>${email.subject}</b></div>
      <div>Timestamp: <b>${email.timestamp}</b></div>
      <hr>
      <p class="m-2"> ${email.body}</p>
      `
    // mark the email as read
    fetch('emails/' + email_id, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })

    // append the email to the view
    view.appendChild(div);

    // add the ability to reply to an email
    const replyButton = document.createElement('button');
    replyButton.className = "btn btn-primary m-1"
    replyButton.innerHTML = "Reply"
    replyButton.addEventListener('click', () => {

      // call the compose function 
      compose_email()

      // show the compose view and hide all others
      document.querySelector('#compose-view').style.display = 'block';
      document.querySelector('#email-view').style.display = 'none';

      // pre-fill the required Re: in the subject space if it is not present already
      let subject = email.subject
      if(subject.split(" ",1)[0] != "Re:") {
        subject = "Re:" + subject;
      }

      // add to the body the sentence about what the sender  said
      let body = `On ${email.timestamp}, ${email.sender} wrote: ${email.body}`;

      // fill the composition email fields
      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = subject;
      document.querySelector('#compose-body').value = body;
    })

    // add the reply button
    view.appendChild(replyButton)

    // add the ability to Archive/Unarchive the email
    const archiveButton = document.createElement('button');
    archiveButton.className = "btn btn-info m-1";
    archiveButton.innerHTML = !email.archived ? "Archive" : "Unarchive";
    archiveButton.addEventListener('click', function () {
      fetch('emails/' + email_id, {
        method: 'PUT',
        body: JSON.stringify({
          archived: !email.archived
        })
      })
      // load the inbox
      .then(response => load_mailbox('inbox'))
    })

    // append the button to the view
    view.appendChild(archiveButton);
  })
}