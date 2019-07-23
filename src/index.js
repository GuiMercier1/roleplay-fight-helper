import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';

const STATUSES = {
    ALIVE: 0,
    DEAD: 1,
    UNDEFINED: 2
}

class Player extends React.Component {

    constructor(props) {
        super(props);

        // We store a temporary player to update the model later
        this.state = {
            init: props.player.init,
            name: props.player.name,
            id: props.player.id
        };

        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleInitChange = this.handleInitChange.bind(this);
    }

    handleNameChange(event) {
        this.setState({
            name: event.target.value
        });
    }

    handleInitChange(event) {
        this.setState({
            init: event.target.value
        });
    }

    saveChanges() {
        this.props.onSave({
            name: this.state.name,
            init: this.state.init
        });
    }

    delete() {
        let hasConfirmed = window.confirm("Voulez-vous vraiment supprimer " + this.state.name + " ?");

        if (hasConfirmed) this.props.onDelete();
    }

    render() {
        const player = this.props.player;
        const isStarted = this.props.isStarted;
        let playerName;
        let playerStatus;
        let actionButtons;
        let className = (isStarted && player.isCurrentPlayer) ? "table-danger" : "";
        let playerInit;

        if (player.isEditing) {
            playerName = <input type="text" name="name" value={this.state.name} placeholder="Nom" onChange={this.handleNameChange}></input>;
            playerInit = <input type="number" className="player-init-input" name="init" value={this.state.init} placeholder="Init" onChange={this.handleInitChange}></input>;
            actionButtons = <div className="action-buttons-wrapper">
                <button className="btn btn-success" onClick={() => this.saveChanges()}><i className="fas fa-check"></i></button>
                <button className="btn btn-danger" onClick={this.props.onCancelEditing}><i className="fas fa-times"></i></button>
            </div>;
        } else {
            playerName = player.name;
            playerInit = player.init;

            if (isStarted && player.status !== STATUSES.DEAD) {
                actionButtons = <button className="btn btn-outline-danger btn-sm kill-player" onClick={this.props.onKill}><i className="fas fa-skull"></i></button>;
            } else if (isStarted && player.status === STATUSES.DEAD) {
                actionButtons = <button className="btn btn-success revive-player" onClick={this.props.onRevive}><i className="fas fa-hand-holding-heart"></i></button>;
            } else {
                actionButtons = <div className="action-buttons-wrapper">
                    <button className="btn btn-outline-info edit-player" onClick={() => this.props.onEditing()}><i className="fas fa-pen"></i></button>
                    <button className="btn btn-outline-danger remove-player" onClick={() => this.delete()}><i className="fas fa-trash"></i></button>
                </div >;
            }

            switch (player.status) {
                case (STATUSES.DEAD):
                    playerStatus = <i className="fas fa-skull"></i>;
                    break;
                case (STATUSES.ALIVE):
                    playerStatus = <i className="fas fa-heartbeat"></i>;
                    break;
                case (STATUSES.UNDEFINED):
                    playerStatus = <i className="far fa-edit"></i>;
                    break;
                default:
                    console.error("Unknown status. Got : " + player.status);
            }
        }

        return (
            <tr className={className}>
                <td>{playerName}</td>
                <td className="player-status-wrapper">{playerStatus}</td>
                <td>{playerInit}</td>
                <td>{actionButtons}</td>
            </tr>
        );
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);

        let basePlayers = [
            {
                id: Date.now() + "" + Math.floor(Math.random() * 1000),
                name: "Player 1",
                init: "14",
                status: STATUSES.ALIVE,
                isCurrentPlayer: false,
                isEditing: false
            },
            {
                id: Date.now() + "" + Math.floor(Math.random() * 1000),
                name: "Player 2",
                init: "33",
                status: STATUSES.ALIVE,
                isCurrentPlayer: false,
                isEditing: false
            }
        ]

        this.state = {
            isStarted: false,
            players: basePlayers
        }
    }

    addPlayer() {
        let players = this.state.players.slice();

        let newPlayer = {
            id: Date.now() + "" + Math.floor(Math.random() * 1000),
            name: "",
            init: "",
            status: STATUSES.UNDEFINED,
            isCurrentPlayer: false,
            isEditing: true
        };

        players.push(newPlayer);

        this.setState({
            players: sortPlayers(players)
        });
    }

    savePlayer(playerID, playerData) {
        let players = this.state.players.slice();

        $.extend(playerData, {
            isEditing: false,
            status: STATUSES.ALIVE
        });

        updatePlayerData(players, playerID, playerData);

        this.setState({
            players: sortPlayers(players)
        });
    }

    deletePlayer(playerID) {
        const newPlayers = this.state.players.filter(player => player.id !== playerID);
        this.setState({
            players: newPlayers
        });
    }

    cancelPlayerEditing(playerID) {

        let players = this.state.players.slice();

        let player = players.find(function (currentPlayer) {
            return currentPlayer.id === playerID;
        });

        if (player.status === STATUSES.UNDEFINED) {
            // We remove it
            this.deletePlayer(playerID);

        } else {
            player.isEditing = false;

            this.setState({
                players: players.slice()
            });
        }
    }

    setEditing(playerID) {

        let players = this.state.players.slice();

        updatePlayerData(players, playerID, { isEditing: true });

        this.setState({
            players: players
        });
    }

    killPlayer(playerID) {
        let players = this.state.players.slice();

        updatePlayerData(players, playerID, { status: STATUSES.DEAD });

        this.setState({
            players: players
        });
    }

    revivePlayer(playerID) {
        let players = this.state.players.slice();

        updatePlayerData(players, playerID, { status: STATUSES.ALIVE });

        this.setState({
            players: players
        });
    }

    play() {
        let players = this.state.players.slice();

        if (players.length < 2) {
            alert("Entrez au moins deux joueurs.");
            return;
        }

        players = players.filter(function (player) {
            return player.status !== STATUSES.UNDEFINED;
        });

        setActivePlayer(players, 0);

        this.setState({
            isStarted: true,
            players: players
        })
    }

    next() {
        let players = this.state.players.slice();

        let currentPlayerIndex = players.findIndex(function (player) {
            return player.isCurrentPlayer;
        });

        let nextIndex = currentPlayerIndex === (players.length - 1) ? 0 : currentPlayerIndex + 1;
        while (players[nextIndex].status === STATUSES.DEAD) {
            nextIndex = nextIndex === (players.length - 1) ? 0 : nextIndex + 1;
        }

        setActivePlayer(players, nextIndex);

        this.setState({
            players: players
        });
    }

    stop() {
        let players = this.state.players.slice();
        players.forEach(function (player) {
            player.status = STATUSES.ALIVE
        });

        this.setState({
            isStarted: false,
            players: players
        });
    }

    render() {

        const players = this.state.players;

        const playerList = players.map((player, index) => {
            return (
                <Player
                    key={player.id}
                    player={player}
                    isStarted={this.state.isStarted}
                    onSave={(playerData) => this.savePlayer(player.id, playerData)}
                    onKill={() => this.killPlayer(player.id)}
                    onRevive={() => this.revivePlayer(player.id)}
                    onCancelEditing={() => this.cancelPlayerEditing(player.id)}
                    onEditing={() => this.setEditing(player.id)}
                    onDelete={() => this.deletePlayer(player.id)} />
            );
        });

        let buttons;
        if (this.state.isStarted) {
            buttons = <div className="p-2 flex-grow-1 bd-highlight m-auto">
                <button className="btn btn-primary next-player m-1" onClick={() => this.next()}><i className="fas fa-forward"></i> Suivant</button>
                <button className="btn btn-info" id="stop_game m-1" onClick={() => this.stop()}><i className="far fa-flag"></i> Stop</button>
            </div >;
        }
        else {
            buttons = <div className="p-2 flex-grow-1 bd-highlight m-auto">
                <button className="btn btn-primary m-1" onClick={() => this.addPlayer()}><i className="fa fa-plus"></i> Ajout</button>
                <button className="btn btn-warning m-1" onClick={() => this.play()}><i className="fas fa-radiation-alt"></i> Jouer</button>
            </div >;
        }

        return (
            <div className="container">
                <div className="d-flex bd-highlight">
                    {buttons}
                </div>
                <table className="table">
                    <thead className="thead-dark">
                        <tr>
                            <th scope="col">Nom</th>
                            <th scope="col"></th>
                            <th scope="col">Init</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>{playerList}</tbody>
                </table>
            </div>
        );
    }
}

// ===================
// HELPERS
// ===================

function sortPlayers(players) {
    return players.sort(function (player_one, player_two) {
        return player_two.init - player_one.init;
    });
}

function setActivePlayer(players, index) {
    players.forEach(function (player, playerIndex) {
        player.isCurrentPlayer = playerIndex === index;
    });
}

function updatePlayerData(players, playerID, playerData) {
    players.forEach(function (player) {
        if (player.id === playerID)
            $.extend(player, playerData);
    });
}

// ==========================
// INIT
// ==========================

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);
