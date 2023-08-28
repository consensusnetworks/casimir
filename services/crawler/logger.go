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
}

type LogEntry struct {
	Level      string `json:"level"`
	Time       string `json:"time"`
	Caller     string `json:"caller"`
	Message    string `json:"message"`
	Stacktrace string `json:"stacktrace"`
}

var EncoderConfig = zapcore.EncoderConfig{
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

func NewConsoleLogger() (*Logger, error) {
	encoder := zapcore.NewJSONEncoder(EncoderConfig)

	sync := zapcore.AddSync(os.Stdout)

	fileLogger := zap.New(
		zapcore.NewCore(encoder, sync, zapcore.DebugLevel),
		zap.AddCaller(),
		zap.AddStacktrace(zap.ErrorLevel),
		zap.AddStacktrace(zap.WarnLevel),
	)

	return &Logger{
		Logger: fileLogger,
	}, nil
}
