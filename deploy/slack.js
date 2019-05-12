const Slack = require('slack-node');
const pkg = require('../package.json');

const webhookUrl = 'https://hooks.slack.com/services/XXXXXXXX/XXXXXXXX/XXXXXXXXXXXXXXXX';

const slack = new Slack();
slack.setWebhook(webhookUrl);
slack.webhook(
  {
    channel: '#devops',
    username: 'devopsbot',
    text: `${pkg.name} updates have been deployed`,
  },
  (resError, response) => {
    console.log(response);

    if (resError) {
      console.trace(resError);
    }
  },
);
