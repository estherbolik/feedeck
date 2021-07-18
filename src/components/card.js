import React from "react";
import { useSelector } from "react-redux";
import { fetchFeed } from "../api/eventuallie";
import { feedsMe } from "../redux/actions";
import FilterSelect from "./filter-select";
import ballclark from "../ballclark.png";

const LoadingClark = () => (
  <div>
    <center>
      <div className="spinClark">
        <img src={ballclark} />
      </div>
    </center>
  </div>
);

class Entry extends React.PureComponent {
  render() {
    const { season, day, phase, tournament, description, metadata } = this.props.data;
    let entryText = "entryText";
    switch (parseInt(metadata?.being)) {
      case -1:
        entryText += " bigdeal";
        break;
      case 0:
        entryText += " shelledone";
        break;
      case 1:
        entryText += " monitor";
        break;
      case 2:
        entryText += " boss";
        break;
      case 3:
        entryText += " reader";
        break;
      case 5:
        entryText += " lootcrates";
        break;
      default:
        break;
    }
    
    let seasInt = parseInt(season);
    let seasStr = `s${seasInt + 1}`;
    let dayStr = `d${parseInt(day) + 1}`;
    if (seasInt >= -99 && seasInt <= -95) {
      seasStr = `s${String.fromCharCode(seasInt + 164)}`;
    } else if (seasInt >= -94 && seasInt <= -69) {
      seasStr = `sA${String.fromCharCode(seasInt + 159)}`;
    }
    switch (parseInt(phase)) {
      case 0:
        dayStr = "G";
        break;
      case 3:
        dayStr = "ES";
        break;
      case 5:
        dayStr = "LS";
        break;
      case 13:
        dayStr = "EL";
        break;
      case 15:
      case 16:
      case 17:
      case 18:
        seasStr = parseInt(tournament) === -1 ? "CC" : "T";
        break;
      default:
        break;
    }
    
    return (
      <div className="entry">
        <div className="entrySeason">
          {seasStr}
        </div>
        <div className="entryDay">
          {dayStr}
        </div>
        <div className={entryText}>
          <ul class="plainlist">
            {description.split("\n").map((line) => (<li>{line}</li>))}
          </ul>
        </div>
      </div>
    );
  }
};

const EntryCluster = ({ id, feedEntries }) => {
  const clustered = feedEntries.reduce((acc, f) => {
    let last = acc.pop();
    if (last.length === 0 || (last[0].season === f.season && last[0].day === f.day && last[0].phase === f.phase)) {
      last.push(f);
      acc.push(last)
      return acc;
    }
    acc.push(last);
    acc.push([f]);
    return acc;
  }, [[]]);

  return (
    <ul className="feedCluster">
      {clustered.map(c => (c.length > 0 &&
        <li key={id + c[0].season + c[0].day + c[0].phase} className="feedCluster">
          <ul className="feedList" key={"ul" + c[0].season + c[0].day + c[0].phase}>
            {c.map(e => (
              <li key={"e" + e.id} className="feedEntry">
                <Entry data={e} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
};

const Entries = (props) => {
  const { filters, id } = props;
  const feedEntries = useSelector((state) => state.feeds[id]);
  const [ loading, setLoading ] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchFeed({
      playerIds: filters.playerIds,
      teamIds: filters.teamIds,
      eventTypes: filters.eventTypes,
      beings: filters.beings,
      categories: filters.categories
    })
    .then(r => {
      if (!cancelled) {
        feedsMe(id, r, true);
        setLoading(false);
      }
    });
    return () => (cancelled = true);
  }, [filters, id]);
  const lastUpdate = useSelector((state) => state.lastUpdate);

  const [ loadingMore, setLoadingMore ] = React.useState(false);
  const loadMore = () => {
    setLoadingMore(true);
    let before = lastUpdate;
    if (feedEntries?.length > 0) {
      const last = feedEntries[feedEntries.length - 1];
      before = Date.parse(last.created);
    }
    fetchFeed({
      playerIds: filters.playerIds,
      teamIds: filters.teamIds,
      eventTypes: filters.eventTypes,
      beings: filters.beings,
      categories: filters.categories,
      before: before,
    })
    .then(r => {
      feedsMe(id, r, false, true);
      setLoadingMore(false);
    });
  };

  return (
    <>
    {loading && <LoadingClark />}
    {feedEntries && <EntryCluster id={id} feedEntries={feedEntries} />}
    {loadingMore ?
      <LoadingClark /> :
      !loading && (<div className="loadMore">
        <center>
          <button onClick={loadMore} >Load more</button>
        </center>
      </div>)
    }
    {/*
    <ul className="feedList">
      {feedEntries && feedEntries.map(f => {
        return (
          <li key={f.id} className="feedEntry">
            <Entry data={f} />
          </li>
        );
      })}
    </ul>
    */}
    </>
  );
};

const Card = (props) => {
  const { filters, id } = props;

  return (
    <div className="card">
      <FilterSelect id={id} />
      <Entries filters={filters} id={id} />
    </div>
  );
}

export default Card;
