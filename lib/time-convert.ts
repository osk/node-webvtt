export function convertTimestamp(time: number): string {
  const hours = pad(calculateHours(time), 2);
  const minutes = pad(calculateMinutes(time), 2);
  const seconds = pad(calculateSeconds(time), 2);
  const milliseconds = pad(calculateMs(time), 3);
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

export function printableTimestamp(timestamp: number): string {
  const ms = Number((timestamp % 1).toFixed(3));
  timestamp = Math.round(timestamp - ms);
  const hours = Math.floor(timestamp / 3600);
  const mins = Math.floor((timestamp - hours * 3600) / 60);
  const secs = timestamp - hours * 3600 - mins * 60;

  // TODO hours aren't required by spec, but we include them, should be config
  const hourString = `${pad(hours, 2)}:`;
  return `${hourString}${pad(mins, 2)}:${pad(secs, 2)}.${pad(ms * 1000, 3)}`;
}

function pad(num: number, zeroes: number): string {
  let output = `${num}`;

  while (output.length < zeroes) {
    output = `0${output}`;
  }

  return output;
}

function calculateHours(time: number): number {
  return Math.floor(time / 60 / 60);
}

function calculateMinutes(time: number): number {
  return Math.floor(time / 60) % 60;
}

function calculateSeconds(time: number): number {
  return Math.floor(time % 60);
}

function calculateMs(time: number): number {
  return Math.floor(Number((time % 1).toFixed(4)) * 1000);
}
