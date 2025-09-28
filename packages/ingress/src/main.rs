use std::io::Write as _;

use dotenvy::dotenv;
use imap::types::Fetch;
use uuid::Uuid;

pub struct ENV {
    pub mail_host: String,
    pub mail_port: u16,
    pub username: String,
    pub password: String,
}

fn main() {
    println!("Hello, world!");

    dotenv().ok();

    let env = ENV {
        mail_host: std::env::var("MAIL_HOST").unwrap(),
        mail_port: std::env::var("MAIL_PORT").unwrap().parse::<u16>().unwrap(),
        username: std::env::var("MAIL_USERNAME").unwrap(),
        password: std::env::var("MAIL_PASSWORD").unwrap(),
    };

    let client = imap::ClientBuilder::new(env.mail_host, env.mail_port)
        .connect()
        .unwrap();
    let mut imap_session = client.login(env.username, env.password).unwrap();

    imap_session.select("INBOX").unwrap();

    let mut imap = imap_session
        .fetch("1:*", "(RFC822 UID ENVELOPE FLAGS INTERNALDATE)")
        .unwrap();
    // let mut imap = imap_session.fetch("1:*", "(RFC822)").unwrap();

    // let x = imap.iter().next().expect("No Emails found");

    // let body = x.body().unwrap();
    // println!("{}", String::from_utf8_lossy(body));
    // println!("{}", &x.envelope().unwrap());
    // let env = x.envelope().unwrap();
    // println!("Subject: {}", String::from_utf8_lossy(&env.subject.clone().unwrap()));
    // println!("From: {}", env.from.unwrap());
    // println!("Mid: {}", env.message_id.unwrap());
    // println!("Env: {:?}", env);
    for message in imap.iter() {
        dump_mail(message);
        // let body = msg.body().unwrap();
        // println!("{}", String::from_utf8_lossy(&body));
    }

    imap_session.logout().ok();
}

pub fn dump_mail(fetch: &Fetch) {
    let bodystruct = fetch.bodystructure();
    if bodystruct.is_some() {
        println!("{:?}", bodystruct.unwrap());
    }
    let env = fetch.envelope();
    if env.is_some() {
        let env = env.unwrap();
        // println!("{:?}", env.subject.map(|s| String::from_utf8(s)));
        println!("{:?}", env.from);
    }
    let body = fetch.body().unwrap();
    // let body_str = String::from_utf8_lossy(&body);

    // search for "unsubscribe" in the body
    // let re = Regex::new(r"list-unsubscribe").unwrap();
    // let m = re.find(&body_str);
    // if m.is_some() {

    // println!("found unsubscribe");
    // save to file in ./tmp/{email_id}
    let email_id = fetch.uid.unwrap();
    // let email_id = Uuid::new_v4().to_string();
    let mut file = std::fs::File::create(format!("./tmp/{}", email_id)).unwrap();
    file.write_all(&body).unwrap();
    // }
}
