import React from 'react';
import styles from './Footer.module.css';
import { MarkerType } from '../../App';
import { FirestoreError, Timestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../../utils/firebase';

type FooterProps = {
  selectedMarker: MarkerType;
  deleteHandler(e: React.MouseEvent<HTMLButtonElement>, selected: MarkerType): void;
  deleteAllHandler(e: React.MouseEvent<HTMLButtonElement>): void;
};

const Footer: React.FC<FooterProps> = ({ selectedMarker, deleteHandler, deleteAllHandler }) => {
  const { index } = selectedMarker;
  const colRef = collection(db, 'markers');

  const saveHandler = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const data = await addDoc(colRef, {
        location: { lat: selectedMarker.lat, lng: selectedMarker.lng },
        timestamp: Timestamp.now().toString(),
      });
      console.log(data);
    } catch (error) {
      if (error instanceof FirestoreError) {
        throw new Error(error.message);
      }
    }
  };

  return (
    <div className={styles.main}>
      <div className="">Index selected mark : {index}</div>
      <div className={styles.buttons}>
        <button onClick={saveHandler}>Save to database</button>
        <button onClick={(e) => deleteHandler(e, selectedMarker)}>Delete</button>
        <button onClick={deleteAllHandler}>Delete all</button>
      </div>
    </div>
  );
};

export default Footer;
