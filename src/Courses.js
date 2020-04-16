import React, { Component } from 'react';
import { firestore } from './Firebase.js';
import ContentEditable from 'react-contenteditable';
import { random_id, stringToColour, hexToRgbA, stripHtml } from './util.js';
import closeIcon from './close.png';
import './Courses.css';

class Courses extends Component {

    constructor(props) {
        super(props);
        this.db = firestore();
        this.state = { classes: [] };
        this.handleOnChange = this.handleOnChange.bind(this);
        this.handleOnBlur = this.handleOnBlur.bind(this);
        this.handleOnKeyDown = this.handleOnKeyDown.bind(this);
        this.handleOnParticipate = this.handleOnParticipate.bind(this);
        this.handleOnNewClass = this.handleOnNewClass.bind(this);
        this.handleOnClassTitleChange = this.handleOnClassTitleChange.bind(this);
        this.handleOnFocusClassTitle = this.handleOnFocusClassTitle.bind(this);
        this.handleOnBlurClassTitle = this.handleOnBlurClassTitle.bind(this);
        this.handleClassDelete = this.handleClassDelete.bind(this);
    }

    getClasses() {
        return this.db.collection("classes").orderBy("title", "asc").get().then(querySnapshot => {
            const classes = []
            querySnapshot.forEach(doc => {
                const id = doc.id;
                const { title } = doc.data();
                classes.push({
                    id, title
                });
                this.db.collection("classes").doc(id).collection("participants").get().then(snap => {
                    let participants = [];
                    snap.forEach(doc => {
                        const id = doc.id;
                        const user = doc.data();
                        participants.push({
                            name: user.name,
                            confidence: user.confidence,
                            id
                        });
                    });
                    this.setState({ [id] : participants })
                });
            });
            this.setState({ classes });
        });
    }

    handleOnChange(event, classId, userId) {
        this.setState((state, props) => {
            const participants = this.state[classId];
            const userIdx = participants.findIndex(user => user.id === userId);
            participants[userIdx].name = event.target.value;

            return { [classId]: participants };
        });
    }

    handleOnBlur(event, classId, userId) {
        const participants = this.state[classId];
        const userIdx = participants.findIndex(user => user.id === userId);
        const participant = participants[userIdx];
        if (stripHtml(participant.name).length == 0) {
            console.log("Delete");
            participants.splice(userIdx, 1);
            this.setState({ [classId]: participants }, () => {
                this.db.collection("classes").doc(classId).collection("participants").doc(userId).delete();
            });
        } else {
            this.db.collection("classes").doc(classId).collection("participants").doc(userId).update(participant);
        }
    }

    handleOnKeyDown(event) {
        if (event.key === "Enter") {
            event.target.blur();
            event.preventDefault();
        }
    }

    handleOnParticipate(event, classId, confidence) {
        const { classes } = this.state;
        const classIdx = classes.findIndex(element => element.id == classId);
        const classData = classes[classIdx];
        const userId = random_id();
        const newUser = {
            id: userId,
            name: "Hier tippen, um Namen zu ändern",
            confidence
        };
        const participants = this.state[classId];
        participants.push(newUser);
        this.setState({ [classId]: participants }, () => {
            this.db.collection("classes").doc(classId).collection("participants").doc(userId).set(newUser);
        });
    }

    handleOnNewClass() {
        const { classes } = this.state;
        const id = random_id();
        const newClass = {
            id,
            title: "Neuer Kurs",
            createdAt: new Date()
        };

        classes.push(newClass);
        this.setState({ classes, [id]: [] }, () => {
            this.db.collection("classes").doc(id).set(newClass);
        });
    }

    handleClassDelete(event, classId) {
        if (window.confirm("Bist du sicher, dass du diesen Kurs löschen willst?")) {
            let { classes } = this.state;
            const classIdx = classes.findIndex(element => element.id == classId);
            classes.splice(classIdx, 1);
            this.setState({ classes }, () => {
                this.db.collection("classes").doc(classId).delete();
            })
        }        
    }

    handleOnClassTitleChange(event, classId) {
        const { classes } = this.state;
        const classIdx = classes.findIndex(element => element.id == classId);
        const classData = classes[classIdx];
        classData.title = event.target.value;

        this.setState({
            classes
        });
    }

    handleOnFocusClassTitle(event, classId) {

    }

    handleOnBlurClassTitle(event, classId) {
        const { classes } = this.state;
        const classIdx = classes.findIndex(element => element.id == classId);
        const classData = classes[classIdx];
        this.db.collection("classes").doc(classId).update(classData);
    }

    componentDidMount() {
        this.getClasses();

        // migration
        /*
        this.db.collection("classes").get().then(querySnapshot => {
            querySnapshot.forEach(document => {
                const data = document.data();
                const participants = data.participants;
                participants.forEach(user => {
                    this.db.collection("classes").doc(document.id).collection("participants").doc(user.id).set({
                        name: user.name, confidence: user.confidence
                    });
                });
            });
        });
        */
    }

    render() {
        const { classes } = this.state;
        const classEl = classes.map(classData => {
            const participants = this.state[classData.id];
            if (!participants) {return}
            const participantsEl = participants.map((user) => {
                let html = `${user.name}`;
                const color = hexToRgbA(stringToColour(user.name), 0.3)
                return (
                    <li key={user.id} style={{ padding: "5px", margin: "4px", backgroundColor: color }}>
                        <ContentEditable
                            html={html}
                            onChange={(evt) => this.handleOnChange(evt, classData.id, user.id)}
                            tagName="div"
                            style={{ display: "inline-block", minWidth: "1rem", padding: "0", margin: "0 0 0 0" }}
                            onBlur={evt => this.handleOnBlur(evt, classData.id, user.id)}
                            onFocus={evt => {
                                const participants = this.state[classData.id];
                                const userIdx = participants.findIndex(u => u.id === user.id);
                                if (participants[userIdx].name === "Hier tippen, um Namen zu ändern") {
                                    participants[userIdx].name = ""
                                    this.setState({
                                        [classData.id]: participants
                                    });
                                }
                            }}
                            onKeyDown={evt => this.handleOnKeyDown(evt)}
                            autoComplete="off" autoCorrect="off" autoCapitalize="on" spellCheck="false"
                        />
                        {user.confidence === "maybe" && <span style={{ opacity: 0.66, paddingLeft: "0.5em" }}>(vielleicht)</span>}
                    </li>
                );
            });

            return (
                <li key={classData.id} style={{ borderBottom: "1px solid #ccc", paddingBottom: "16px" }}>
                    <div style={{display: "flex", alignItems: "center"}}>
                        <ContentEditable
                            html={classData.title}
                            className="classes-title"
                            onChange={(evt) => this.handleOnClassTitleChange(evt, classData.id)}
                            onBlur={(evt) => this.handleOnBlurClassTitle(evt, classData.id)}
                            onFocus={(evt) => this.handleOnFocusClassTitle(evt, classData.id)}
                            onKeyDown={(evt) => this.handleOnKeyDown(evt)}
                            tag="span"
                            style={{display: "inline-block"}}
                        />
                        <img src={closeIcon} width="25px" height="25px" onClick={evt => this.handleClassDelete(evt, classData.id)}  />
                    </div>
                    <ul className="participants-list">
                        {participantsEl}
                    </ul>
                    <button style={{ marginRight: "8px" }} onClick={evt => this.handleOnParticipate(evt, classData.id, "sure")}>Teilnehmen</button>
                    <button onClick={evt => this.handleOnParticipate(evt, classData.id, "maybe")}>Vielleicht</button>
                </li>
            );
        });
        return (
            <>
                <ul className="classes-list">
                    {classEl}
                </ul>
                <div>
                    <button onClick={this.handleOnNewClass}>Neuer Kurs</button>
                </div>
            </>
        );
    }
}

export default Courses;