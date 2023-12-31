import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import lodash from "lodash";
import { useRecoilState, useSetRecoilState } from "recoil";
import weatherDataState, { WeatherDataType } from "../recoilState/WeatherData";
import weatherContainerVisibilityState from "../recoilState/WeatherContainer";
import cloudLoaderVisibilityState from "../recoilState/CloudLoader";
interface CityFormData {
  city: string;
}

interface GeoResponse {
  lat: number;
  lon: number;
  name: string;
}

const formSchema = yup.object().shape({
  city: yup.string().required("You must add a city first"),
});

const apiKey: string = import.meta.env.VITE_APP_OPEN_WEATHER_API_KEY as string;
const DATA_API_KEY: number = 0;

function InputForm() {
  const [weatherDataArray, setWeatherDataArray] =
    useRecoilState(weatherDataState);

  const setWeatherContainerVisibilityState = useSetRecoilState(
    weatherContainerVisibilityState
  );

  const setCloudLoaderVisibilityState = useSetRecoilState(
    cloudLoaderVisibilityState
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CityFormData>({
    resolver: yupResolver(formSchema),
  });

  useEffect(() => {
    console.log(weatherDataArray);
  }, [weatherDataArray]);

  const onSubmit = async (data: CityFormData) => {
    setCloudLoaderVisibilityState(true);
    setWeatherContainerVisibilityState(false);

    try {
      const geoResponse = await axios.get<GeoResponse[]>(
        `https://api.openweathermap.org/geo/1.0/direct?q=${data.city}&appid=${apiKey}`
      );
      const geoData: GeoResponse = geoResponse.data[DATA_API_KEY];

      const weatherResponse = await axios.get<WeatherDataType>(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${geoData.lat}&lon=${geoData.lon}&appid=${apiKey}&units=metric`
      );

      const weatherData = weatherResponse?.data?.list?.[DATA_API_KEY];
      const weatherBlockData = {
        cityName: geoData.name,
        time: weatherData?.dt,
        tempMin: weatherData?.main?.temp_min,
        tempMax: weatherData?.main?.temp_max,
        weatherIcon: weatherData?.weather[0].icon,
        weatherDesc: weatherData?.weather[0].description,
        humidity: weatherData?.main?.humidity,
        wind_speed: weatherData?.wind?.speed,
      };

      setWeatherDataArray((prevData: WeatherDataType) => {
        if (lodash.isEqual(prevData?.[geoData.name], weatherBlockData)) {
          return prevData;
        }

        return {
          ...prevData,
          [geoData.name]: weatherBlockData,
        };
      });

      setWeatherContainerVisibilityState(true);
    } catch (error) {
      console.error("There was an error!", error);
    } finally {
      setWeatherContainerVisibilityState(true);
      setCloudLoaderVisibilityState(false);
    }
  };

  return (
    <form className="weatherForm" onSubmit={handleSubmit(onSubmit)}>
      <div className="inputContainer">
        <input type="text" placeholder="Enter city" {...register("city")} />
        <input type="submit" value="Check Weather" />
      </div>

      <p>{errors.city?.message}</p>
    </form>
  );
}

export default InputForm;
