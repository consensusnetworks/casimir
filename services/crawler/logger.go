package main

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

const (
	LogFile = "services/crawler/logs.ndjson"
)

type Logger struct {
	*zap.Logger
	// Keep warn and error logs in a local file
	Local bool
}

type LogEntry struct {
	Level      string `json:"level"`
	Time       string `json:"time"`
	Caller     string `json:"caller"`
	Message    string `json:"message"`
	Stacktrace string `json:"stacktrace"`
}

func NewLogger(local bool) (*Logger, error) {
	if !local {
		logger, err := zap.NewProduction()

		if err != nil {
			return nil, err
		}

		return &Logger{
			Logger: logger,
			Local:  local,
		}, nil
	}

	var file *os.File

	_, err := os.Stat(LogFile)

	if os.IsNotExist(err) {
		f, err := os.Create(LogFile)

		if err != nil {
			return nil, err
		}
		file = f
	}

	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "time",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		MessageKey:     "message",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.SecondsDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	fileEncoder := zapcore.NewJSONEncoder(encoderConfig)

	logLevel := zap.LevelEnablerFunc(func(lvl zapcore.Level) bool {
		return lvl >= zapcore.WarnLevel
	})

	fileWriteSyncer := zapcore.AddSync(file)

	fileLogger := zap.New(
		zapcore.NewCore(fileEncoder, fileWriteSyncer, logLevel),
		zap.AddCaller(),
		zap.AddStacktrace(zap.ErrorLevel),
		zap.AddStacktrace(zap.WarnLevel),
	)

	return &Logger{
		Logger: fileLogger,
		Local:  local,
	}, nil
}
