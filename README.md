# Figma Notification now in Rocket.Chat

![Horizontal Banner](https://github.com/irffanasiff/Apps.Figma/blob/versions_delete_notifications/assets/FigmaAppCover.png)

Rocket.Chat and Figma integration offers figma notifications directly inside rocket.chat channels. Teams/individuals will receive personalized updates for different events from figma for a project, file or a team they have subscribed to. This will improve workflow and the functionality of design teams so that teams can deliver better products faster.

<h2>App Features</h2>
<ul>
  <li>Customize your Rocket.Chat channel to recieve notifications on specific files, projects, and teams</li>
  <li>Get notification in DM when you are tagged in figma</li>
  <li>Reply to comments and create new comments directly from Rocket.Chat</li>
  <li>Get notified when a file is updated or deleted</li>
  <li>Get notified when a new version of file is created or a new component is published inside a library</li>
  <li>Notifications on branch updates coming soon </li>
</ul>


<h2>Setting up Figma App</h2>

 1. Install the app from the [marketplace](https://www.rocket.chat/marketplace) or clone the repository and add the zip file manually to your rocket.chat server.</br>
 2. Go to [figma api](https://www.figma.com/developers/apps) and create a figma app. </br>
![Figma app registration](https://github.com/irffanasiff/Apps.Figma/blob/versions_delete_notifications/assets/NewFigmaAppSS.png)
 3. Get the callback url from the app settings page in rocket.chat and add it to the figma app. </br>
 4. Copy the client id and client secret and paste it in the app settings ( don't forget to click on save button ) </br>
 5. You are all set to go now. use `/figma connect` command to connect your figma account with rocket.chat. </br>
