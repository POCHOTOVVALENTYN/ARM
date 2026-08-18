fetch('http://localhost:8000/api/schedule/init')
  .then(res => res.json())
  .then(data => {
    console.log(data.vehicle_blocks[0]);
  })
  .catch(console.error);
