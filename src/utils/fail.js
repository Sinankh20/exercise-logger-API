export default function fail (status, message){
  const err = new Error(message);
  err.status = status;
  return err;
};
